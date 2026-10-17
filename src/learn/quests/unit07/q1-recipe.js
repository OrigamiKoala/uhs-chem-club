/**
 * q1-recipe.js — Kettle, bench one: THE SAME RECIPE. (Built as Ligar's bench three.)
 *
 * The first bench of Kettle, and the last of Unit 1's heirs on the TABLETOP (plan `bench-tabletop.md`, phase
 * T2c): the atom kit at HEAP SCALE (`table/kits/heap.js`). Tallow joined atoms one at a time; here a recipe is
 * built once by hand and then asked of heaps too big to place atom by atom, and the stages are about what that
 * recipe fixes: how many atoms a molecule takes, which heap gives out, what share of the weight each element
 * carries. Kettle has no walkable world, so at T4 the table stands in a room of its own (`rooms.js`, the
 * foundry: cast-iron plate, firebrick ore tubs, a lamp over the plate), held to the same rules as any host.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  build one molecule from the loose atoms, to match three samples      -> a compound has a fixed composition
 *   2  shake two samples and tray the one that is not a true compound        -> extra atoms make a mixture
 *   3  weigh the same atoms loose and joined, and see the weight stay        -> conservation of mass
 *   4  build a molecule, let the maker copy it from two heaps until one       -> the limiting reactant
 *      gives out, mark that heap, tally what was made
 *   5  weigh the atoms of a molecule one by one, set a bar of a hundred       -> percent composition
 *      parts at the oxygen's share
 *   6  build the molecule whose ledger of weights runs 3 to 8                -> the empirical formula
 *   7  tray three samples under the recipe their molecules follow            -> the recipe is the identity
 *   8  shake and read three shipments against one label                      -> a recipe is a test you can run
 *   -- debrief: what a formula really claims, and what the last bench does.
 *
 * WHAT THIS BENCH DOES NOT DO. Every molecule it asks about is one you can count. Every sample on it is
 * molecular, so "molecule" is the honest word throughout; an ionic solid has formula units, and none is put on
 * this bench. Counting a heap far too large to count is bench four, and the mole belongs there, not here.
 *
 * NOTHING ON THE TABLE IS AUTHORED. Every join is `joinbench.js` `planJoin` (the atom kit); the maker copies
 * whatever molecule the player put in its dock, atom for atom; every weight is the listed mass of the atoms on
 * the pan (`mass.js`); the answers are read off the table by `heap.js` and recomputed by `verify:learn`.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { atomTable, moleculesOf, piecesIn, SCOPE_KINDS } from '../../table/kits/atoms.js';
import {
  heapTable, heap, dock, product, pan, limitOf, madeOf, heapLeft, tallyOf, shareOf, panRead
} from '../../table/kits/heap.js';
import { listedMass } from '../../table/kits/mass.js';

export const meta = { stageCount: 8 };

/** The room this quest's table stands in at T4: Kettle has no world to stand in (`rooms.js`). */
export const ROOM = 'foundry';

/** When each withheld word is earned. Specific terms first. */
export const VOCABULARY = [
  { term: /\blimiting reactants?\b/i, introducedAt: 4 },
  { term: /\bconservation of mass\b/i, introducedAt: 3 },
  { term: /\bfixed composition\b/i, introducedAt: 1 },
  { term: /\bpercent composition\b/i, introducedAt: 5 },
  { term: /\bempirical formulas?\b/i, introducedAt: 6 }
];

const SPEAKER = 'Vess';

/** The scope's own catalogue of what it has weighed (the same masses Tallow charted). */
export const KINDS = SCOPE_KINDS;

/**
 * Every key on this table says what it does on its cap or is a piece you drag ("Make Molecule", "Weigh",
 * the shaker), so none carries a legend.
 */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   SHAPES
   A `kinds` list alone means one centre with the rest holding on to it. Where that would misstate what is
   joined to what, the entry draws itself: the scope does not lie about the salvage.
   ------------------------------------------------------------------ */

/** One oxygen with two hydrogens on it, bent. */
const WATER = { kinds: ['k08', 'k01', 'k01'] };

/** One nitrogen with three hydrogens on it. */
const AIR_GROUP = { kinds: ['k07', 'k01', 'k01', 'k01'] };

/** One carbon with four hydrogens on it. */
const GAS_GROUP = { kinds: ['k06', 'k01', 'k01', 'k01', 'k01'] };

/** Two oxygens in a chain with one hydrogen on each end — not a star. */
const PEROXIDE = {
  kinds: ['k08', 'k08', 'k01', 'k01'],
  geom: [[-0.52, 0], [0.52, 0], [-1.0, -0.78], [1.0, 0.78]],
  bonds: [[0, 1], [0, 2], [1, 3]]
};

/* ------------------------------------------------------------------
   THE TABLES
   One size (120 x 64 units, the atom tables'). The samples and the heaps along the top, the work in the middle,
   the scratch corner bottom left where a stage has atoms to play with.
   ------------------------------------------------------------------ */

/** A dish of a sample, open at the power where atoms resolve: the picture is the evidence. */
const dishAt = (id, label, particles, x, y) => ({
  id, kind: 'dish', label, at: { x, y }, props: { sample: { id: `kettle-${id}`, floorPower: 1, particles }, view: 1 }
});

/** A loose atom. */
const atomAt = (id, el, x, y) => ({ id, kind: 'atom', label: el, at: { x, y }, props: { el } });

const TOOL_HOME = { shaker: { x: 98, y: 55 } };
const shaker = () => ({ id: 'shaker', kind: 'shaker', label: 'Shaker', at: { ...TOOL_HOME.shaker } });

/** A tray for dishes: wide pieces, so a wider pitch and a deeper tray. */
const dishTray = (id, label, x, y, w = 38, h = 20) => ({ id, label, at: { x, y }, size: { w, h }, cell: 19 });

const dishIn = (t, tray) => piecesIn(t, `tray:${tray}`, 'dish').map(p => p.id).sort();

const to = (piece, target) => ({ place: { piece, to: target } });
const joinTo = (a, b) => ({ join: [a, b] });

/** What the maker needs of water: the recipe this bench teaches, written once for the checks. */
const WATER_NEED = { H: 2, O: 1 };

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Three Sources, One Molecule',
    briefing: {
      speaker: SPEAKER,
      body: 'Each dish holds a sample from a different foundry floor. Drag one loose atom onto another to join them.'
    },
    prompt: 'Build one molecule of the substance in the three samples.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        dishAt('a1', 'SAMPLE A', [{ ...WATER, n: 8 }], 22, 13),
        dishAt('a2', 'SAMPLE B', [{ ...WATER, n: 12 }], 46, 13),
        dishAt('a3', 'SAMPLE C', [{ ...WATER, n: 10 }], 70, 13),
        ...[['h1', 'H'], ['h2', 'H'], ['h3', 'H'], ['h4', 'H'], ['o1', 'O'], ['o2', 'O'], ['c1', 'C'], ['n1', 'N']]
          .map(([id, el], i) => atomAt(id, el, 12 + i * 12, 34))
      ]
    }),
    hints: [
      'Drag a loose atom onto another to join them, and use Pull Out to take one back out of a molecule.',
      'Look closely at one molecule in any dish, and match each of its atoms to a loose atom by tint and size.',
      'Join one loose atom for every atom in that one molecule, the middle one first and then each atom joined to it.'
    ],
    check(state) {
      const mols = moleculesOf(state.table);
      if (!mols.length) return { ok: false, notYet: true, msg: 'Join some atoms together first.' };
      if (mols.some(m => m.counts.H === 2 && m.counts.O === 1 && Object.keys(m.counts).length === 2)) return { ok: true };
      if (mols.some(m => m.counts.C || m.counts.N)) return { ok: false, msg: 'None of the three samples holds that kind of atom. Compare the tints and sizes in a dish with the loose atoms.' };
      if (mols.some(m => m.counts.H && m.counts.O)) return { ok: false, msg: 'Right kinds of atom, wrong numbers. Count the atoms joined to the middle one in a dish.' };
      return { ok: false, msg: 'One of the two kinds of atom is missing. Read the middle atom and the joined ones separately.' };
    },
    reward: {
      log: 'All three samples: two hydrogen to one oxygen.',
      title: 'A Compound Has a Fixed Composition',
      body: 'Every sample contains the same ratio: two hydrogens to one oxygen. A compound has a fixed composition, maintaining the exact same ratio of elements regardless of source.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'The Wrong Proportions',
    briefing: {
      speaker: SPEAKER,
      body: 'The shaker sorts loose atoms by weight. Draw it under a dish to see whether the sample separates into layers.'
    },
    prompt: 'Tray the sample that does not behave as a true compound.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        dishAt('b1', 'SAMPLE A', [{ ...WATER, n: 10 }], 22, 13),
        dishAt('b2', 'SAMPLE B', [{ ...WATER, n: 8 }, { kinds: ['k01'], n: 7 }], 46, 13),
        shaker()
      ],
      zones: {
        trays: [
          dishTray('true', 'True compound', 30, 36),
          dishTray('false', 'Not a true compound', 82, 36)
        ]
      }
    }),
    hints: [
      'Draw the shaker across each dish in turn and watch how its atoms settle.',
      'Count the layers each sample settles into, and look for any atom that sits outside a molecule.',
      'A sample of one compound settles into one layer with every atom inside a molecule, so tray the one that fails either half of that.'
    ],
    check(state) {
      const t = state.table;
      const good = dishIn(t, 'true');
      const bad = dishIn(t, 'false');
      if (good.length + bad.length < 2) return { ok: false, notYet: true, msg: 'Tray both samples before you commit.' };
      if (good.join() === 'b1' && bad.join() === 'b2') return { ok: true };
      if (bad.includes('b1') && !bad.includes('b2')) return { ok: false, msg: 'One oxygen to two hydrogens is the recipe you built on the last stage, so there is nothing wrong with that sample.' };
      if (bad.length === 2) return { ok: false, msg: 'Draw the shaker under Sample A and look at it closely: is any atom in it sitting outside a molecule?' };
      return { ok: false, msg: 'Draw the shaker under both samples and count the layers each one makes.' };
    },
    reward: {
      log: 'Sample B: molecules plus loose hydrogen. Two layers.',
      title: 'Extra Atoms Make a Mixture',
      body: 'Sample B contains pure molecules alongside unbonded hydrogen atoms. Adding extra atoms cannot change a compound\'s formula; the excess remains separated as a mixture.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Weigh Before and After',
    briefing: {
      speaker: SPEAKER,
      body: 'The scale weighs everything on its pan at once. Each time you press "Weigh" it writes the molecules made and the total weight on the strip.'
    },
    prompt: 'Find out what joining does to the weight of the atoms on the bench.',
    widget: { type: 'table', label: 'The bench' },
    table: heapTable({
      recorder: { at: { x: 30, y: 47 }, size: { w: 46, h: 28 }, xLabel: 'Molecules made', yLabel: 'Total weight' },
      pieces: [
        ...['h1', 'h2', 'h3', 'h4'].map((id, i) => atomAt(id, 'H', 10 + i * 12, 10)),
        ...['o1', 'o2'].map((id, i) => atomAt(id, 'O', 10 + i * 12, 24))
      ],
      zones: { containers: [pan('pan', 'Pan', { x: 96, y: 40 }, { w: 44, h: 28 })] },
      fixtures: [{
        id: 'scale', kind: 'scale', label: 'Scale', runLabel: 'Weigh', at: { x: 96, y: 11 }, size: { w: 46, h: 20 },
        props: { pan: 'container:pan', unit: 'u', atoms: true }
      }]
    }),
    hints: [
      'Put the loose atoms on the pan and press "Weigh", then lift them off, join them on the table, put them back and press "Weigh" again.',
      'Each press prints a point on the strip, with the molecules made across and the total weight up.',
      'Weigh the same atoms before and after they are joined, and compare the weights of the two points.'
    ],
    check(state) {
      const rows = state.table.recorder.rows;
      if (!rows.length) return { ok: false, notYet: true, msg: 'Nothing has been weighed yet. Put atoms on the pan and press "Weigh".' };
      if (new Set(rows.map(r => r.y)).size > 1) return { ok: false, msg: 'The weighings do not agree because the pan held different atoms each time. Weigh the same atoms before and after they are joined.' };
      if (new Set(rows.map(r => r.x)).size < 2) return { ok: false, notYet: true, msg: 'One state of the atoms cannot show a change. Join them into molecules and weigh again.' };
      return { ok: true };
    },
    reward: {
      log: 'The bench weighs the same before and after.',
      title: 'Conservation of Mass',
      body: 'Joining only rearranges atoms, so the bench weighs the same afterwards: this is the conservation of mass. It is why one molecule weighs what its atoms weigh, 16.0 for the oxygen plus 1.0 for each hydrogen.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'One Heap Runs Out',
    briefing: {
      speaker: SPEAKER,
      body: 'The maker copies the molecule in its dock, taking the atoms for each copy from the two heaps.'
    },
    prompt: 'Mark the heap that runs out first, and set the tally to the number of water molecules the two heaps make.',
    widget: { type: 'table', label: 'The bench' },
    table: heapTable({
      pieces: [
        ...['h1', 'h2', 'h3'].map((id, i) => atomAt(id, 'H', 10 + i * 12, 31)),
        ...['o1', 'o2'].map((id, i) => atomAt(id, 'O', 46 + i * 12, 31)),
        { id: 'tag', kind: 'tag', label: 'Runs out first', at: { x: 92, y: 32 } }
      ],
      zones: {
        containers: [
          heap('heap-h', 'Hydrogen heap', 'H', 18, { x: 17, y: 14 }),
          heap('heap-o', 'Oxygen heap', 'O', 11, { x: 49, y: 14 }),
          product('made', 'Built', { x: 92, y: 14 }, 24),
          dock('dock', 'Recipe', { x: 17, y: 51 })
        ]
      },
      fixtures: [
        {
          id: 'maker', kind: 'maker', label: 'Maker', runLabel: 'Make Molecule', at: { x: 54, y: 50 }, size: { w: 36, h: 20 },
          props: { dock: 'container:dock', heaps: { H: 'heap-h', O: 'heap-o' }, product: 'made' }
        },
        { id: 'tally', kind: 'tally', label: 'Tally', at: { x: 96, y: 50 }, size: { w: 36, h: 16 }, noRun: true, dials: { n: { min: 0, max: 12, step: 1, value: 0, label: 'Molecules made' } } }
      ]
    }),
    hints: [
      'Build one molecule on the table, put it in the dock, and press "Make Molecule" to copy it from the heaps.',
      'Watch the two heaps shrink as molecules collect in the built tray, and note which heap empties first.',
      'Keep pressing until a heap cannot supply another, then put the card on that heap and set the tally to the molecules built.'
    ],
    check(state) {
      const t = state.table;
      const left = { H: t.zones.containers['heap-h'].capacity, O: t.zones.containers['heap-o'].capacity };
      const want = limitOf(left, WATER_NEED);
      const heapOf = { H: 'container:heap-h', O: 'container:heap-o' };
      const at = t.pieces.tag.zone;
      const tally = tallyOf(t, 'tally');
      if (at !== heapOf.H && at !== heapOf.O) return { ok: false, notYet: true, msg: 'Put the card on the heap that runs out first.' };
      if (tally === 0) return { ok: false, notYet: true, msg: 'The tally is on zero. Set it to the number of molecules the heaps make.' };
      if (!want.limiting.map(el => heapOf[el]).includes(at)) return { ok: false, msg: 'That heap is not the one that gives out first. Compare how much of each atom one molecule takes with how much each heap holds.' };
      if (tally !== want.made) return { ok: false, msg: 'The tally does not match what the heaps can make. Build molecules until a heap cannot supply another, then count what was built.' };
      return { ok: true };
    },
    reward: {
      log: 'One heap ran out with atoms left in the other.',
      title: 'The Limiting Reactant',
      body: 'A recipe takes atoms in a fixed ratio, so the heap that gives out first decides how many molecules can be made. It is called the limiting reactant, and whatever is left of the other heap is left over.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Which Share Is Which',
    prompt: 'What fraction of water\'s total mass comes from oxygen, out of every hundred parts by weight?',
    widget: { type: 'table', label: 'The bench' },
    table: heapTable({
      pieces: [
        atomAt('o1', 'O', 10, 12),
        atomAt('h1', 'H', 22, 12),
        atomAt('h2', 'H', 10, 28)
      ],
      zones: { containers: [pan('pan', 'Pan', { x: 60, y: 16 }, { w: 36, h: 22 })] },
      fixtures: [
        { id: 'scale', kind: 'scale', label: 'Scale', at: { x: 98, y: 16 }, size: { w: 38, h: 16 }, noRun: true, props: { pan: 'container:pan', unit: 'u' } },
        {
          id: 'share', kind: 'share', label: 'A hundred parts by weight', at: { x: 60, y: 47 }, size: { w: 108, h: 22 }, noRun: true,
          props: { left: 'oxygen', right: 'the rest' }, dials: { share: { min: 0, max: 100, step: 1, value: 0, label: 'Oxygen' } }
        }
      ]
    }),
    hints: [
      'Drop the oxygen on the scale\'s pan, then each hydrogen, and read the weight after every one.',
      'The bar is a hundred equal parts, and the marker splits it into the oxygen\'s part and the rest.',
      'The oxygen\'s part is its weight out of the whole molecule\'s weight, scaled up to a hundred.'
    ],
    check(state) {
      const v = shareOf(state.table, 'share');
      if (v === 0) return { ok: false, notYet: true, msg: 'Set the marker where the oxygen\'s part ends.' };
      const near = a => Math.abs(v - a) <= 1;
      if (near(67) || near(33)) return { ok: false, msg: 'That is a share of the atoms, not of the weight. One oxygen weighs sixteen times what one hydrogen does.' };
      if (near(50)) return { ok: false, msg: 'An even split would need the two hydrogens to weigh as much as the oxygen between them, and they weigh 2.0 against 16.0.' };
      // Water's oxygen is 16.0 of 18.0, which is 88.9 of a hundred: the marker may stand on 89, a part either side.
      const exact = (100 * listedMass('O')) / (listedMass('O') + 2 * listedMass('H'));
      if (Math.abs(v - exact) > 1.5) return { ok: false, msg: 'The marker is not where the oxygen\'s weight ends. Compare the oxygen\'s weight with the weight of the whole molecule.' };
      return { ok: true };
    },
    reward: {
      log: 'Sample A: 89 out of 100 by weight is oxygen.',
      title: 'Percent Composition',
      body: 'Percent composition is the fraction of total mass contributed by each element. In water, oxygen accounts for 16.0 of the 18.0 total mass, or 89 percent.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Backwards From the Weight',
    prompt: 'Build the molecule that has 3 parts carbon to 8 parts oxygen by weight.',
    widget: { type: 'table', label: 'The bench' },
    table: heapTable({
      pieces: [
        ...['c1', 'c2'].map((id, i) => atomAt(id, 'C', 10 + i * 12, 12)),
        ...['o1', 'o2', 'o3'].map((id, i) => atomAt(id, 'O', 10 + i * 12, 28))
      ],
      zones: { containers: [pan('pan', 'Pan', { x: 62, y: 43 }, { w: 36, h: 26 })] },
      fixtures: [
        { id: 'drum', kind: 'plate', label: 'Drum', at: { x: 98, y: 12 }, size: { w: 36, h: 18 }, noRun: true, props: { lines: ['by weight', '3 parts carbon', '8 parts oxygen'] } },
        { id: 'scale', kind: 'scale', label: 'Scale', at: { x: 98, y: 33 }, size: { w: 32, h: 16 }, noRun: true, props: { pan: 'container:pan', unit: 'u' } },
        { id: 'ledger', kind: 'ledger', label: 'Weight of each', at: { x: 98, y: 52 }, size: { w: 32, h: 20 }, noRun: true, props: { pan: 'container:pan' } }
      ]
    }),
    hints: [
      'Join carbon and oxygen atoms into a molecule, put it on the pan, and read the scale and the ledger beside it.',
      'The ledger gives the weight of each element in the molecule, to set beside the drum\'s two numbers.',
      'Divide the ledger\'s two weights by the largest number that goes into both, and look for the molecule that gives the drum\'s pair.'
    ],
    check(state) {
      const read = panRead(state.table, 'container:pan');
      if (!read.ids.length) return { ok: false, notYet: true, msg: 'The pan is empty. Build a molecule and put it on the pan.' };
      if (read.parts.length > 1) return { ok: false, notYet: true, msg: 'The pan holds more than one piece. Keep one molecule on it.' };
      if (read.ids.length < 2) return { ok: false, msg: 'A single atom is not a molecule. Join the atoms before you weigh them.' };
      const c = (read.counts.C || 0) * listedMass('C');
      const o = (read.counts.O || 0) * listedMass('O');
      if (Object.keys(read.counts).some(el => el !== 'C' && el !== 'O') || c * 8 !== o * 3) {
        return { ok: false, msg: 'That molecule\'s carbon and oxygen do not weigh in the drum\'s ratio. Read the ledger and compare the two weights.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Drum: 3 to 8 by weight is 1 to 2 by count.',
      title: 'The Empirical Formula',
      body: 'Dividing each mass share by atomic weight yields the mole ratio. Reducing 3 parts carbon and 8 parts oxygen gives a 1:2 ratio, matching carbon dioxide.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Name Three Samples',
    prompt: 'Tray each sample under the recipe its molecules follow.',
    widget: { type: 'table', label: 'The bench' },
    table: heapTable({
      pieces: [
        dishAt('g1', 'SAMPLE A', [{ ...WATER, n: 9 }], 84, 14),
        dishAt('g2', 'SAMPLE B', [{ ...AIR_GROUP, n: 8 }], 84, 34),
        dishAt('g3', 'SAMPLE C', [{ ...GAS_GROUP, n: 7 }], 84, 54),
        ...[['rh', 'H'], ['rc', 'C'], ['rn', 'N'], ['ro', 'O']].map(([id, el], i) => atomAt(id, el, 108, 12 + i * 14))
      ],
      zones: {
        trays: [
          dishTray('m1', 'One oxygen to two hydrogens', 34, 13, 64, 17),
          dishTray('m2', 'One nitrogen to three hydrogens', 34, 33, 64, 17),
          dishTray('m3', 'One carbon to four hydrogens', 34, 53, 64, 17)
        ]
      }
    }),
    hints: [
      'Drag each dish into a tray, and match the atoms in its picture to the loose atoms along the top by tint and size.',
      'In each sample find the big atom in the middle of a molecule and count the small atoms hanging off it.',
      'Read the middle atom and the count of hydrogens round it for each sample, then find the tray that names that same pair.'
    ],
    check(state) {
      const t = state.table;
      const where = {};
      for (const tray of ['m1', 'm2', 'm3']) for (const id of dishIn(t, tray)) where[id] = tray;
      const names = { g1: 'Sample A', g2: 'Sample B', g3: 'Sample C' };
      for (const id of ['g1', 'g2', 'g3']) if (!where[id]) return { ok: false, notYet: true, msg: `${names[id]} has no tray yet.` };
      const want = { g1: 'm1', g2: 'm2', g3: 'm3' };
      for (const id of ['g1', 'g2', 'g3']) {
        if (where[id] !== want[id]) return { ok: false, msg: `${names[id]} is filed wrong. Read the middle atom in one of its molecules, and count the hydrogens on it.` };
      }
      return { ok: true };
    },
    reward: {
      log: 'Three samples, three recipes, three weights.',
      title: 'The Recipe Is the Identity',
      body: 'A compound\'s identity depends strictly on which elements it contains and their numerical ratio. Different ratios define entirely different chemical substances.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Three Claims',
    prompt: 'Tray each shipment by whether it matches its label.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        dishAt('h1', 'SAMPLE A', [{ ...WATER, n: 10 }], 14, 12),
        dishAt('h2', 'SAMPLE B', [{ ...WATER, n: 8 }, { kinds: ['k01'], n: 8 }], 34, 12),
        dishAt('h3', 'SAMPLE C', [{ ...PEROXIDE, n: 8 }], 54, 12),
        shaker()
      ],
      zones: {
        trays: [
          dishTray('yes', 'As claimed', 30, 36),
          dishTray('no', 'Not as claimed', 80, 36)
        ]
      },
      fixtures: [{
        id: 'label', kind: 'plate', label: 'Label', at: { x: 92, y: 13 }, size: { w: 56, h: 22 }, noRun: true,
        props: { lines: ['Label: sold as', 'condensate, one oxygen', 'to two hydrogens only'] }
      }]
    }),
    hints: [
      'Draw the shaker across each dish, and count the atoms in one molecule of each.',
      'The label claims one oxygen to two hydrogens, and a sample fails it by holding a different molecule or by holding anything besides that molecule.',
      'Test each sample twice, since two layers after shaking fails it and a molecule that is not one oxygen with two hydrogens fails it, and only a sample that passes both is as claimed.'
    ],
    check(state) {
      const t = state.table;
      const yes = dishIn(t, 'yes');
      const no = dishIn(t, 'no');
      if (yes.length + no.length < 3) return { ok: false, notYet: true, msg: 'Tray all three shipments before you commit.' };
      if (yes.join() === 'h1' && no.join() === 'h2,h3') return { ok: true };
      return { ok: false, msg: 'At least one shipment is in the wrong tray. Shake it, count one molecule at high power, and check both against the label.' };
    },
    reward: {
      log: 'One as claimed, one a mixture, one a different compound.',
      title: 'A Recipe Is a Test You Can Run',
      body: 'A pure compound has an exact, unvarying chemical formula. Any shift in atom ratio or unbonded excess indicates a mixture or an entirely different substance.',
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
      body: 'A compound holds the same elements in the same ratio wherever it came from and however much of it you have. Put in more of one element and it does not become a new compound; the extra just sits there as a mixture.'
    },
    {
      heading: 'By Weight',
      body: 'That fixed recipe fixes the weights too: what one molecule weighs, and what share of that weight each element brings. Running it backwards, a weight ratio divided by the atoms\' own masses gives you the recipe of something you never opened.'
    },
    {
      heading: 'Next',
      body: 'You counted molecules on this bench because there were few enough to count. One automaton still walks the yard: the Recipe Golem, bound by the very recipes you have balanced.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'Water from a comet and water from a tap are both analysed. What is true of the hydrogen-to-oxygen ratio?',
    options: [
      { id: 'a', label: 'It is 2 to 1 in both, because a compound has a fixed composition' },
      { id: 'b', label: 'It depends on where the water came from' },
      { id: 'c', label: 'It depends on how much of each sample was taken' },
      { id: 'd', label: 'Only the comet sample has a fixed ratio' }
    ],
    answer: 'a',
    explanation: 'A compound is defined by its ratio of atoms, and that ratio comes from how many bonds each atom can make. Water is H2O wherever it is found, which is why a formula is worth writing at all.'
  },
  {
    question: 'A joiner bonds 2 hydrogen atoms and 1 oxygen atom into each water molecule. How many molecules can 6 hydrogen atoms and 5 oxygen atoms make?',
    options: [
      { id: 'a', label: '3 molecules, and the hydrogen is the limiting reactant' },
      { id: 'b', label: '5 molecules, and the oxygen is the limiting reactant' },
      { id: 'c', label: '6 molecules, because the hydrogen sets the count' },
      { id: 'd', label: '11 molecules, because every atom is used' }
    ],
    answer: 'a',
    explanation: 'Six hydrogens make three molecules at two apiece, and three molecules need only 3 of the 5 oxygens. The hydrogen gives out first, so it limits the count and 2 oxygens are left over.'
  },
  {
    question: 'Water is H2O. Hydrogen weighs 1.0 and oxygen 16.0. What percent of water\'s mass is oxygen?',
    options: [
      { id: 'a', label: 'About 33 percent' },
      { id: 'b', label: 'About 50 percent' },
      { id: 'c', label: 'About 67 percent' },
      { id: 'd', label: 'About 89 percent' }
    ],
    answer: 'd',
    explanation: 'One molecule weighs 16.0 + 1.0 + 1.0 = 18.0, of which oxygen is 16.0. 16.0 / 18.0 = 0.889, so 89 percent. Two thirds of the atoms are hydrogen, but they carry almost none of the mass.'
  },
  {
    question: 'A compound is 3 g of carbon to 8 g of oxygen. Carbon weighs 12.0 and oxygen 16.0. What is its empirical formula?',
    options: [
      { id: 'a', label: 'CO' },
      { id: 'b', label: 'CO2' },
      { id: 'c', label: 'C3O8' },
      { id: 'd', label: 'C2O' }
    ],
    answer: 'b',
    explanation: 'Divide each mass by that element\'s atomic mass to get counts: 3 / 12.0 = 0.25 and 8 / 16.0 = 0.5. The ratio 0.25 to 0.5 reduces to 1 to 2, so the formula is CO2. C3O8 is the mass ratio read as if it were a count.'
  },
  {
    question: 'Extra hydrogen gas is bubbled into a flask of water. What is in the flask afterwards?',
    options: [
      { id: 'a', label: 'A new compound with more hydrogen in it' },
      { id: 'b', label: 'Water, plus hydrogen sitting alongside it as a mixture' },
      { id: 'c', label: 'Nothing has changed, because the hydrogen is absorbed' },
      { id: 'd', label: 'Hydrogen peroxide' }
    ],
    answer: 'b',
    explanation: 'A water molecule has no room for a third hydrogen: oxygen makes two bonds and both are taken. The extra hydrogen cannot join, so it stays as a separate substance mixed in with the water.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const free = (piece, x, y) => to(piece, `free:${x},${y}`);
const makes = n => Array.from({ length: n }, () => ({ run: 'maker' }));

/** Weigh three atoms loose, take them off, join them on the table, and weigh the molecule: the same atoms, joined. */
const WEIGH_LOOSE = [to('h1', 'container:pan'), to('h2', 'container:pan'), to('o1', 'container:pan'), { run: 'scale' }];

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [joinTo('h1', 'o1'), joinTo('h2', 'o1')],
  [joinTo('shaker', 'b1'), joinTo('shaker', 'b2'), to('b1', 'tray:true'), to('b2', 'tray:false')],
  [
    ...WEIGH_LOOSE,
    free('h1', 58, 29), free('h2', 58, 44), free('o1', 58, 59),
    joinTo('h1', 'o1'), joinTo('h2', 'o1'), to('o1', 'container:pan'), { run: 'scale' }
  ],
  [
    joinTo('h1', 'o1'), joinTo('h2', 'o1'), to('o1', 'container:dock'),
    ...makes(9),
    to('tag', 'container:heap-h'), { setDial: { fixture: 'tally', dial: 'n', value: 9 } }
  ],
  [to('o1', 'container:pan'), to('h1', 'container:pan'), to('h2', 'container:pan'), { setDial: { fixture: 'share', dial: 'share', value: 89 } }],
  [joinTo('c1', 'o1'), joinTo('c1', 'o2'), to('c1', 'container:pan')],
  [to('g1', 'tray:m1'), to('g2', 'tray:m2'), to('g3', 'tray:m3')],
  [joinTo('shaker', 'h1'), joinTo('shaker', 'h2'), joinTo('shaker', 'h3'), to('h1', 'tray:yes'), to('h2', 'tray:no'), to('h3', 'tray:no')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [joinTo('h1', 'o1')],
  [to('b1', 'tray:false'), to('b2', 'tray:true')],
  [...WEIGH_LOOSE, to('h3', 'container:pan'), to('h4', 'container:pan'), to('o2', 'container:pan'), { run: 'scale' }],
  [
    joinTo('h1', 'o1'), joinTo('h2', 'o1'), to('o1', 'container:dock'),
    ...makes(9),
    to('tag', 'container:heap-o'), { setDial: { fixture: 'tally', dial: 'n', value: 9 } }
  ],
  [to('o1', 'container:pan'), to('h1', 'container:pan'), to('h2', 'container:pan'), { setDial: { fixture: 'share', dial: 'share', value: 67 } }],
  [joinTo('c1', 'o1'), to('c1', 'container:pan')],
  [to('g1', 'tray:m1'), to('g2', 'tray:m3'), to('g3', 'tray:m2')],
  [joinTo('shaker', 'h1'), joinTo('shaker', 'h2'), joinTo('shaker', 'h3'), to('h1', 'tray:yes'), to('h2', 'tray:yes'), to('h3', 'tray:no')]
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
    // No world under Kettle: the table stands in a room of its own.
    room: ROOM,
    onLoad() { /* the table is the stage; there are no keys or readouts to lay out */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

export { madeOf, heapLeft };
