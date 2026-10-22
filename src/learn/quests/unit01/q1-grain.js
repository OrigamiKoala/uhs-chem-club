/**
 * q1-grain.js — Tallow, site one: THE GRAIN OF THINGS.
 *
 * The first game on the Learn road, and the first on a TABLETOP (plan
 * `bench-tabletop.md`, phase T1). Eight stages on the sample point at the
 * conveyor's tail: samples in dishes, a lens that lies over a dish and shows what
 * it is made of, a cutter drawn across one, loose atoms that join when they are put
 * together, and trays to sort into. A stage is graded on what is on the table when
 * Submit is pressed.
 *
 * WORDS ARE FREE, PHENOMENA ARE DISCOVERED. Every atom on this bench is called by
 * its real element name from stage one. What the player discovers is never the
 * word; it is the observation: one powder holds a single element, joined groups
 * survive the cutter, the same atoms lie loose in a mixture and joined in a
 * compound, and two atoms put together hold or do not hold, which the planner
 * decides and no stage declares.
 *
 * THE TOOLS SAY WHAT THEY DO. Each tool hangs on the shelf at the right of the table with one
 * plain line printed under it (`caption`), and the stages that join atoms print how to join
 * and how to undo a join (`notes`). A tool the player cannot work out is a bug in the bench.
 *
 *   1  find the lowest power where single particles show -> Atoms
 *   2  sort the samples by how many kinds of atom        -> Elements and Mixtures
 *   3  read the ore's atoms and sort them by element     -> Every Element Has Its Own Atom
 *   4  draw the cutter across four samples               -> Atoms Do Not Split
 *   5  build one molecule of Sample A                    -> Water, H2O
 *   6  build one molecule of each sample                 -> Compounds
 *   7  make a mixture and a compound from the same atoms -> Mixture or Compound?
 *   8  sort four samples as element, compound, mixture   -> Elements, Compounds, and Mixtures
 *   -- debrief: what the element numbers mean & preview of the atomic core.
 *
 * THE TABLE (`table/`, `kits/atoms.js`). Everything that happens is the kit asking a
 * pure planner: the lens draws `scope.js` `drawScopeField`, the cutter is `planCut`,
 * and a join is `joinbench.js` `planJoin`. No stage here
 * declares an outcome; `SOLUTIONS` and `MISSES` are scripts of the player's own
 * actions, replayed by `verify:table` by drag and by two taps.
 *
 * FIELD (T4). Stage 1 sends the player to the conveyor tail for a scoop: a field
 * point on the sample point's cross-cut sampler. It is evidence and never a lock; the
 * stage is answered at the bench either way. At T1 to T3 the same stage draws a site
 * plate on the table, and a tap on it is the same `fetch`.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings. It
 * reports through `ctx` and nothing else.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import {
  atomTable, piecesIn, moleculesOf, dishUnder, SCOPE_KINDS
} from '../../table/kits/atoms.js';

export const meta = { stageCount: 8 };

const SPEAKER = 'Vess';

/**
 * The legend lines. A key whose label says what it does owes nothing, and the pieces of this
 * table are dragged, not pressed, so there is nothing to explain here. Kept so the quest
 * contract (`toolNoteFor`) holds.
 */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE ELEMENTS
   What the scope has met before. Every atom is called by its real element name from the
   start; the table is the kit's (`kits/atoms.js` `SCOPE_KINDS`), re-exported because the
   other Unit 1 and Kettle benches read the same masses and sizes.
   ------------------------------------------------------------------ */
export const KINDS = SCOPE_KINDS;

export const POWER_SCALES = {
  1: '1 mm',
  2: '100 µm',
  3: '10 µm',
  4: '1 µm',
  5: '100 nm',
  6: '1 nm'
};

/* ------------------------------------------------------------------
   SHAPES
   A `kinds` list alone means one center with the rest holding on to it.
   Where that would misstate what is joined to what, the entry draws itself.
   ------------------------------------------------------------------ */

/** One heavy atom with two light ones attached, bent. */
const CLUSTER_A = { kinds: ['k08', 'k01', 'k01'] };

/** Two heavy atoms in a chain with one light atom on each end — not a star. */
const CLUSTER_B = {
  kinds: ['k08', 'k08', 'k01', 'k01'],
  geom: [[-0.52, 0], [0.52, 0], [-1.0, -0.78], [1.0, 0.78]],
  bonds: [[0, 1], [0, 2], [1, 3]]
};

/** Two of the lightest atom bonded to each other: one kind, and still bonded. */
const PAIR_LIGHT = { kinds: ['k01', 'k01'] };

/* ------------------------------------------------------------------
   WHEN EACH WORD IS EARNED

   `introducedAt` is the stage whose REWARD CARD first uses the word. `verify:learn`
   reads this table to hold each card to its promise; nothing in it is player-facing.
   ------------------------------------------------------------------ */
export const VOCABULARY = [
  { term: /\b(atoms?|atomic)\b/i, introducedAt: 1 },
  { term: /\belements?\b/i, introducedAt: 2 },
  { term: /\bmixtures?\b/i, introducedAt: 2 },
  { term: /\b(molecules?|molecular)\b/i, introducedAt: 4 },
  { term: /\bcompounds?\b/i, introducedAt: 6 }
];

/* ------------------------------------------------------------------
   THE TABLES
   One layout (120 x 64 units), so the furniture is always where the hand expects it:
     the work (dishes, trays, loose atoms) on the left, x 2 to 88;
     the TOOL SHELF on the right, x 90 to 118: the lens, its power dial, the cutter, each
     with its one line printed under it, and the field plate where a scoop is taken.
   A dish is 16 units across, a tray holds two of them with room, and nothing stands on
   the words printed beside it (`table/audit.js`, held by `verify:table`).
   ------------------------------------------------------------------ */

const SHELF = 104;

const sample = (id, floorPower, particles, magnify) => ({ id, floorPower, ...(magnify ? { magnify } : {}), particles });

const dishAt = (id, label, s, x, y = 12, open = false) => ({
  id, kind: 'dish', label, at: { x, y }, props: { sample: s, ...(open ? { view: 1 } : {}) }
});

const TOOL_HOME = { lens: { x: SHELF, y: 10 }, cutter: { x: SHELF, y: 52 } };
const CAPTIONS = { lens: 'Drag over a dish', cutter: 'Drag across a dish' };
const tool = (kind, label) => ({ id: kind, kind, label, at: { ...TOOL_HOME[kind] }, caption: CAPTIONS[kind] });

/** A loose atom. `mask` withholds the symbol, `tint` overrides the element's own. */
const atomAt = (id, el, x, y, props = {}) => ({ id, kind: 'atom', label: props.mask ? 'Atom' : el, at: { x, y }, props: { el, ...props } });

/** The lens's power dial: a fixture with no Run key, printing what each step shows. */
const POWER_LABELS = Object.entries(POWER_SCALES).map(([n, s]) => `${n} (${s})`);
const scopeFixture = {
  id: 'scope', kind: 'scope', label: 'Lens', at: { x: SHELF, y: 36 }, size: { w: 28, h: 16 }, noRun: true,
  props: { top: 10.5 },
  dials: { power: { min: 1, max: 6, step: 1, value: 1, label: 'Power', labels: POWER_LABELS } }
};

/** A tray for dishes, a tray of one row: two dishes with room. */
const dishTray = (id, label, x, y = 34, w = 40, h = 17) => ({ id, label, at: { x, y }, size: { w, h }, cell: 17 });
const trayAt = (id, label, x, y, w = 26, h = 16) => ({ id, label, at: { x, y }, size: { w, h } });

/** What a table that joins atoms tells the player about joins. Printed on the plate, at the foot of the work. */
const JOIN_NOTES = [
  { at: { x: 4, y: 57.5 }, text: 'Drop one atom onto another to join them.' },
  { at: { x: 4, y: 61.5 }, text: 'Tap the join between two atoms to break it.' }
];

/** Lay `ids` of atoms in a row at y: `row('H', 'H', 'O')` -> positions along the middle. */
const heap = (y, list, x0 = 12, pitch = 12) => list.map(([id, el], i) => atomAt(id, el, x0 + i * pitch, y));

const power = (t) => t.fixtures.scope?.dials.power.value;
const lensOver = (t) => dishUnder('lens', t);
const dishIn = (t, tray) => piecesIn(t, `tray:${tray}`, 'dish').map(p => p.id).sort();

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Zoom In',
    briefing: {
      speaker: SPEAKER,
      body: 'Drag the lens onto the dish and slide the power dial: higher power shows a smaller part of the sample, bigger. Press Submit when the dial is where you want it.'
    },
    prompt: 'Set the lens to the lowest power at which you can see separate particles in Sample A.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        dishAt('dishA', 'SAMPLE A', sample('c7', 4, [{ kinds: ['k06'], n: 46 }]), 24),
        { ...dishAt('scoop', 'BELT SCOOP', sample('c7s', 4, [{ kinds: ['k06'], n: 46 }]), 50), hidden: true, fetchFrom: 'tail' },
        tool('lens', 'Lens')
      ],
      fixtures: [scopeFixture],
      fetch: [{ id: 'tail', label: 'Belt scoop', at: { x: SHELF - 2, y: 55 } }]
    }),
    hints: [
      'Drag the lens onto the dish, then slide the power dial up one step at a time and watch the picture change.',
      'At low power the sample looks like solid clumps, and at high power you can tell round particles apart.',
      'Find the first power where you can pick out single particles, then step down one and check that the picture there is still clumps.'
    ],
    check(state) {
      const t = state.table;
      const p = power(t);
      if (p === 4) return { ok: true };
      if (!lensOver(t)) return { ok: false, notYet: true, msg: 'Drag the lens over the dish to look through it.' };
      if (p < 4) return { ok: false, msg: 'Too low. At that power the sample still looks like solid clumps.' };
      return { ok: false, msg: 'Too high. That power shows the same particles, just bigger. Go back to the first power where they appear.' };
    },
    reward: {
      log: 'Atoms resolved at power 4.',
      title: 'Atoms',
      body: 'Zoom in far enough and matter stops being smooth: it is made of separate tiny particles. These particles are called atoms.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'One Kind or Two?',
    prompt: 'Sort the samples by how many different kinds of atom each one holds.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        dishAt('dishA', 'SAMPLE A', sample('c09', 4, [{ kinds: ['k06'], n: 44 }]), 24),
        dishAt('dishB', 'SAMPLE B', sample('c14', 4, [{ kinds: ['k06'], n: 26 }, { kinds: ['k11'], n: 18 }]), 48),
        tool('lens', 'Lens')
      ],
      zones: {
        trays: [
          dishTray('one', 'One kind of atom', 24),
          dishTray('more', 'More than one kind', 66)
        ]
      },
      fixtures: [scopeFixture]
    }),
    hints: [
      'Drag the lens onto a sample and turn the power up until single atoms show.',
      'Compare the two pictures atom by atom: every atom in one sample matches, and the other sample holds two different atoms.',
      'Look across a whole picture and note the tint and size of each atom, then put the sample whose atoms all match in the first tray.'
    ],
    check(state) {
      const t = state.table;
      const one = dishIn(t, 'one');
      const more = dishIn(t, 'more');
      if (!one.length && !more.length) return { ok: false, notYet: true, msg: 'Put both samples in a tray before you submit.' };
      if (one.length + more.length < 2) return { ok: false, notYet: true, msg: 'Put both samples in a tray before you submit.' };
      if (one.join() === 'dishA' && more.join() === 'dishB') return { ok: true };
      return { ok: false, msg: 'Look again: one of them holds dark carbon atoms and pale sodium atoms together, so it is in the wrong tray.' };
    },
    reward: {
      log: 'Sample A is carbon only. Sample B mixes carbon and sodium.',
      title: 'Elements and Mixtures',
      body: 'A substance made of only one kind of atom is called an element. Different atoms sitting together without joining make a mixture.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Count the Elements',
    prompt: 'Sort the ore into trays so that each tray holds one element only.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        // Sodium and magnesium are dressed alike on purpose: only the reader tells them apart.
        atomAt('a1', 'Na', 12, 10, { mask: true, tint: 'pale' }),
        atomAt('a2', 'C', 26, 10, { mask: true }),
        atomAt('a3', 'Mg', 40, 10, { mask: true, tint: 'pale' }),
        atomAt('a4', 'Mg', 12, 24, { mask: true, tint: 'pale' }),
        atomAt('a5', 'Na', 26, 24, { mask: true, tint: 'pale' }),
        atomAt('a6', 'C', 40, 24, { mask: true })
      ],
      zones: {
        slots: [{ id: 'rd', label: 'Reader slot', at: { x: 66, y: 12 } }],
        trays: [
          trayAt('t1', 'Tray 1', 17, 50, 26, 16),
          trayAt('t2', 'Tray 2', 45, 50, 26, 16),
          trayAt('t3', 'Tray 3', 73, 50, 26, 16),
          trayAt('t4', 'Tray 4', 101, 50, 26, 16)
        ]
      },
      fixtures: [{ id: 'reader', kind: 'reader', label: 'Reader', at: { x: 98, y: 14 }, size: { w: 36, h: 14 }, noRun: true, props: { slot: 'rd' } }],
      notes: [{ at: { x: 4, y: 36 }, text: 'Put an atom in the reader slot to read its name and mass.' }]
    }),
    hints: [
      'Drop an atom in the reader slot to see its name and its mass.',
      'Two of the elements look alike, but their masses differ: one reads 23.0 and the other 24.3.',
      'Read every pale atom, then give each element a tray of its own and put every atom in the tray for its name.'
    ],
    check(state) {
      const t = state.table;
      const atoms = Object.values(t.pieces).filter(p => p.kind === 'atom' && !p.props.scratch);
      const filed = atoms.filter(p => p.zone && p.zone.startsWith('tray:'));
      if (filed.length < atoms.length) return { ok: false, notYet: true, msg: 'Every atom needs a tray before you submit.' };
      const byTray = {};
      for (const p of filed) (byTray[p.zone] ||= new Set()).add(p.props.el);
      if (Object.values(byTray).some(s => s.size > 1)) {
        return { ok: false, msg: 'A tray holds atoms of more than one element. The pale ones look alike, so read their masses.' };
      }
      const homes = {};
      for (const [zone, set] of Object.entries(byTray)) for (const el of set) (homes[el] ||= []).push(zone);
      if (Object.values(homes).some(z => z.length > 1)) {
        return { ok: false, msg: 'Atoms of one element are split across two trays. Each element belongs in one tray only.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Three elements found: sodium, magnesium and carbon.',
      title: 'Every Element Has Its Own Atom',
      body: 'The atoms of different elements differ in mass and size. When two elements look identical under the scope, weighing an atom tells them apart.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'What the Blade Cannot Cut',
    briefing: {
      speaker: SPEAKER,
      body: 'The cutter is a blade: drag it across a dish and it slices that sample into smaller pieces, if it can. Try it on each sample and watch what happens.'
    },
    prompt: 'Find the one sample the cutter cannot split, and put it in the tray.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        dishAt('t1', 'SAMPLE A', sample('t1', 1, [{ kinds: ['k06'], n: 20 }], 1.5), 14, 12, true),
        dishAt('t2', 'SAMPLE B', sample('t2', 1, [{ ...CLUSTER_A, n: 1 }], 3.6), 36, 12, true),
        dishAt('t3', 'SAMPLE C', sample('t3', 1, [{ ...PAIR_LIGHT, n: 1 }], 3.6), 58, 12, true),
        dishAt('t4', 'SAMPLE D', sample('t4', 1, [{ kinds: ['k02'], n: 1 }], 3.6), 80, 12, true),
        tool('cutter', 'Cutter')
      ],
      zones: { trays: [dishTray('safe', 'Will not split', 47, 38, 40)] }
    }),
    hints: [
      'Drag the cutter across each dish in turn and watch the picture.',
      'Joined groups break into separate pieces, but one sample does not change at all.',
      'Pick the sample whose picture remains completely unchanged after cutting.'
    ],
    check(state) {
      const safe = dishIn(state.table, 'safe');
      if (!safe.length) return { ok: false, notYet: true, msg: 'Put a sample in the tray first.' };
      if (safe.join() === 't4') return { ok: true };
      return { ok: false, msg: 'That one came apart under the blade. Pick the sample the cutter left exactly as it was.' };
    },
    reward: {
      log: 'A single helium atom will not divide.',
      title: 'Atoms Do Not Split',
      body: 'Groups of atoms joined together are called molecules, and the cutter splits them apart. A lone atom cannot be divided.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Copy the Molecule',
    prompt: 'Build one molecule of Sample A from the loose atoms.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        dishAt('dishA', 'SAMPLE A', sample('v9', 4, [{ ...CLUSTER_A, n: 20 }], 1.5), 24),
        ...heap(36, [['c1', 'C'], ['h1', 'H'], ['o1', 'O'], ['h2', 'H'], ['o2', 'O'], ['h3', 'H'], ['h4', 'H']]),
        tool('lens', 'Lens')
      ],
      fixtures: [scopeFixture],
      notes: JOIN_NOTES
    }),
    hints: [
      'Drag the lens over Sample A and raise the power until one molecule is clear, then drag one loose atom onto another to join them.',
      'Every molecule here is the same, so read just one: the atom in the middle and each atom joined to it.',
      'Join one atom for every atom in that one molecule, by name: the middle one plus each joined one, and nothing else.'
    ],
    check(state) {
      const mols = moleculesOf(state.table);
      if (!mols.length) return { ok: false, notYet: true, msg: 'Join some atoms together first.' };
      if (mols.some(m => m.counts.H === 2 && m.counts.O === 1 && Object.keys(m.counts).length === 2)) return { ok: true };
      if (mols.some(m => m.counts.C)) return { ok: false, msg: 'There is no carbon in this sample. Read the atoms in one molecule through the lens.' };
      if (mols.some(m => m.counts.H && m.counts.O)) return { ok: false, msg: 'Right elements, wrong numbers. Count the middle atom and the ones joined to it.' };
      return { ok: false, msg: 'One of the two elements is missing. Read the middle atom and the joined ones separately.' };
    },
    reward: {
      log: 'Copy built: 1 x oxygen, 2 x hydrogen.',
      title: 'Water, H2O',
      body: 'Each water molecule contains one oxygen atom joined to two hydrogen atoms. A fixed combination of atoms defines a molecule.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Same Atoms, Different Recipe',
    prompt: 'Build one molecule of each sample from the loose atoms.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        dishAt('dishA', 'SAMPLE A', sample('vA', 4, [{ ...CLUSTER_A, n: 16 }], 1.5), 24),
        dishAt('dishB', 'SAMPLE B', sample('vB', 4, [{ ...CLUSTER_B, n: 14 }], 1.5), 48),
        ...heap(36, [['h1', 'H'], ['o1', 'O'], ['h2', 'H'], ['o2', 'O'], ['h3', 'H'], ['o3', 'O'], ['h4', 'H']]),
        tool('lens', 'Lens')
      ],
      fixtures: [scopeFixture],
      notes: JOIN_NOTES
    }),
    hints: [
      'Drag the lens over each sample and raise the power until a single molecule is clear.',
      'Both samples use only hydrogen and oxygen, and the difference is how many oxygen atoms each molecule holds.',
      'Copy one molecule from each sample, joining the atoms the way the lens shows them, and join the hydrogen atoms before the oxygen atoms.'
    ],
    check(state) {
      const mols = moleculesOf(state.table);
      const has = (h, o) => mols.some(m => m.counts.H === h && m.counts.O === o && Object.keys(m.counts).length === 2);
      if (!mols.length) return { ok: false, notYet: true, msg: 'Build a molecule of each sample before you submit.' };
      if (has(2, 1) && has(2, 2)) return { ok: true };
      if (!has(2, 1)) return { ok: false, msg: 'No molecule on the table matches Sample A yet. Count the oxygen atoms in one of its molecules.' };
      return { ok: false, msg: 'No molecule on the table matches Sample B yet. Count the oxygen atoms in one of its molecules.' };
    },
    reward: {
      log: 'Sample A: H2O. Sample B: H2O2.',
      title: 'Compounds',
      body: 'Two or more different elements bonded together make a compound. Changing the recipe produces a different substance with different properties.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Mixture or Compound?',
    prompt: 'Make a mixture and a compound from the hydrogen and oxygen atoms.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        ...heap(14, [['h1', 'H'], ['o1', 'O'], ['h2', 'H'], ['o2', 'O'], ['h3', 'H'], ['h4', 'H']])
      ],
      zones: {
        trays: [
          trayAt('mix', 'Mixture', 24, 48, 40, 24),
          trayAt('comp', 'Compound', 68, 48, 40, 24)
        ]
      },
      notes: [
        { at: { x: 4, y: 24.5 }, text: 'Drop one atom onto another to join them.' },
        { at: { x: 4, y: 29 }, text: 'Tap the join between two atoms to break it.' }
      ]
    }),
    hints: [
      'Drag atoms into each tray, and drop an atom onto another atom to join the two.',
      'Look at what sits in each tray: are the atoms joined together, or only lying side by side?',
      'Leave the atoms in the Mixture tray unjoined, and join atoms into a group before you drop them in the Compound tray.'
    ],
    check(state) {
      const t = state.table;
      const atoms = Object.values(t.pieces).filter(p => p.kind === 'atom' && !p.props.scratch);
      const inTray = z => atoms.filter(p => p.zone === `tray:${z}`);
      const mix = inTray('mix');
      const comp = inTray('comp');
      if (!mix.length || !comp.length) return { ok: false, notYet: true, msg: 'Put atoms in both trays before you submit.' };
      const els = list => new Set(list.map(p => p.props.el));
      const joinedWithin = list => list.some(p => p.joinedTo.some(n => list.some(q => q.id === n)));
      if (els(mix).size < 2) return { ok: false, msg: 'A mixture needs more than one kind of atom. Put hydrogen and oxygen in the Mixture tray.' };
      if (joinedWithin(mix)) return { ok: false, msg: 'Atoms in the Mixture tray are joined to each other. In a mixture they only lie side by side.' };
      const molecule = moleculesOf(t).some(m => Object.keys(m.counts).length > 1 && m.ids.every(id => t.pieces[id].zone === 'tray:comp'));
      if (!molecule) return { ok: false, msg: 'The Compound tray holds no joined group of different atoms. Join hydrogen and oxygen before you put them in.' };
      return { ok: true };
    },
    reward: {
      log: 'Same atoms: loose in a mixture, joined in a compound.',
      title: 'Mixture or Compound?',
      body: 'The same atoms make a mixture when they lie loose beside each other and a compound when they are joined. Loose atoms can be separated again, but joined atoms cannot be pulled apart without breaking the joins.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Sort Them All',
    prompt: 'Sort each sample as an element, a compound or a mixture.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        dishAt('m1', 'SAMPLE A', sample('m1', 4, [{ kinds: ['k06'], n: 24 }]), 11),
        dishAt('m2', 'SAMPLE B', sample('m2', 4, [{ ...CLUSTER_A, n: 18 }]), 31),
        dishAt('m3', 'SAMPLE C', sample('m3', 4, [{ kinds: ['k06'], n: 12 }, { kinds: ['k16'], n: 12 }]), 51),
        dishAt('m4', 'SAMPLE D', sample('m4', 4, [{ ...PAIR_LIGHT, n: 18 }]), 71),
        tool('lens', 'Lens'),
        tool('cutter', 'Cutter')
      ],
      zones: {
        trays: [
          { id: 'element', label: 'Element', at: { x: 16, y: 44 }, size: { w: 26, h: 33 }, cell: 17 },
          { id: 'compound', label: 'Compound', at: { x: 45, y: 44 }, size: { w: 26, h: 33 }, cell: 17 },
          { id: 'mixed', label: 'Mixture', at: { x: 74, y: 44 }, size: { w: 26, h: 33 }, cell: 17 }
        ]
      },
      fixtures: [scopeFixture]
    }),
    hints: [
      'Drag the lens over each sample and turn the power up until separate atoms show, and use the cutter on any you are unsure of.',
      'For each sample, check two things: how many different names its atoms read, and whether its atoms are joined in groups or sit loose.',
      'One element only is an element even in joined pairs, while different elements joined together make a compound and sitting loose make a mixture.'
    ],
    check(state) {
      const t = state.table;
      const where = {};
      for (const tray of ['element', 'compound', 'mixed']) for (const id of dishIn(t, tray)) where[id] = tray;
      if (['m1', 'm2', 'm3', 'm4'].some(id => !where[id])) return { ok: false, notYet: true, msg: 'Put all four samples in a tray before you submit.' };
      const want = { m1: 'element', m2: 'compound', m3: 'mixed', m4: 'element' };
      const wrong = Object.keys(want).filter(k => where[k] !== want[k]);
      if (!wrong.length) return { ok: true };
      if (wrong.length === 1) {
        return { ok: false, msg: 'One is in the wrong tray. Check whether it holds one element or several, and whether they are bonded.' };
      }
      return { ok: false, msg: 'More than one is in the wrong tray. One element is an element even when its atoms are bonded in pairs.' };
    },
    reward: {
      log: 'All four filed correctly.',
      title: 'Elements, Compounds, and Mixtures',
      last: true,
      body: 'An element has only one kind of atom, a compound bonds different elements together, and a mixture keeps them unbonded. Every substance fits one of these three.'
    }
  }
];

/* ------------------------------------------------------------------
   THE DEBRIEF
   Three short cards: what the player learned, what the element numbers
   mean, and what the next bench is about.
   ------------------------------------------------------------------ */
const DEBRIEF = {
  speaker: 'Vess',
  sections: [
    {
      heading: 'What You Found',
      body: 'Matter is made of atoms. One element on its own is an element, different elements bonded together make a compound, and elements just sitting together unbonded make a mixture.'
    },
    {
      heading: 'What the numbers mean',
      body: 'Nice job! Now let\'s go explore what an atom is made of.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   Five questions covering atoms, elements, molecules, compounds, and
   mixtures. Appear after the debrief, before the player exits.
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'You zoom in until matter stops looking smooth and breaks into separate tiny pieces. What are those pieces called?',
    options: [
      { id: 'a', label: 'Molecules' },
      { id: 'b', label: 'Atoms' },
      { id: 'c', label: 'Elements' },
      { id: 'd', label: 'Compounds' }
    ],
    answer: 'b',
    explanation: 'Atoms are the tiny particles everything is made of. Zooming in further just shows the same atoms bigger.'
  },
  {
    question: 'A sample contains only carbon (C) atoms and nothing else. What kind of substance is it?',
    options: [
      { id: 'a', label: 'A compound' },
      { id: 'b', label: 'A mixture' },
      { id: 'c', label: 'A pure element' },
      { id: 'd', label: 'A molecule' }
    ],
    answer: 'c',
    explanation: 'An element is built from only one kind of atom. Carbon on its own is the element C.'
  },
  {
    question: 'One oxygen (O) atom is bonded to two hydrogen (H) atoms. What have you got?',
    options: [
      { id: 'a', label: 'An element' },
      { id: 'b', label: 'A mixture' },
      { id: 'c', label: 'A molecule (H₂O)' },
      { id: 'd', label: 'An atom' }
    ],
    answer: 'c',
    explanation: 'Atoms bonded together make a molecule. This one is water, H₂O — the molecule you copied.'
  },
  {
    question: 'Carbon (C) atoms and sodium (Na) atoms sit in the same jar, not bonded to each other. What is in the jar?',
    options: [
      { id: 'a', label: 'A compound' },
      { id: 'b', label: 'A mixture' },
      { id: 'c', label: 'A pure element' },
      { id: 'd', label: 'A molecule' }
    ],
    answer: 'b',
    explanation: 'Different atoms that are not bonded make a mixture, and because nothing holds them together they can be separated again.'
  },
  {
    question: 'Hydrogen peroxide (H₂O₂) is two H atoms bonded to two O atoms, always in that ratio. What is H₂O₂?',
    options: [
      { id: 'a', label: 'A mixture' },
      { id: 'b', label: 'An element' },
      { id: 'c', label: 'A chemical compound' },
      { id: 'd', label: 'A loose heap of atoms' }
    ],
    answer: 'c',
    explanation: 'Different elements bonded together in a fixed recipe make a compound. No amount of shaking will separate it.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays
   each one through the reducer by direct actions, by drag and by two taps, and every
   join in it is the kit's planner saying it holds.
   ------------------------------------------------------------------ */

const lay = (toolId, dish) => ({ place: { piece: toolId, to: `piece:${dish}` } });
/** Take the lens off its dish and hang it back on the shelf: a dish under a lens is picked up by its lens. */
const lift = { place: { piece: 'lens', to: `free:${TOOL_HOME.lens.x},${TOOL_HOME.lens.y}` } };
const tray = (piece, id) => ({ place: { piece, to: `tray:${id}` } });
const dial = value => ({ setDial: { fixture: 'scope', dial: 'power', value } });

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [{ fetch: 'tail' }, lay('lens', 'dishA'), dial(4)],
  [lay('lens', 'dishA'), dial(4), lift, tray('dishA', 'one'), lay('lens', 'dishB'), lift, tray('dishB', 'more')],
  [
    { place: { piece: 'a1', to: 'slot:rd' } }, tray('a1', 't1'),
    { place: { piece: 'a3', to: 'slot:rd' } }, tray('a3', 't2'),
    { place: { piece: 'a4', to: 'slot:rd' } }, tray('a4', 't2'),
    { place: { piece: 'a5', to: 'slot:rd' } }, tray('a5', 't1'),
    tray('a2', 't3'), tray('a6', 't3')
  ],
  [
    { place: { piece: 'cutter', to: 'piece:t1' } }, { place: { piece: 'cutter', to: 'piece:t2' } },
    { place: { piece: 'cutter', to: 'piece:t3' } }, { place: { piece: 'cutter', to: 'piece:t4' } },
    tray('t4', 'safe')
  ],
  [lay('lens', 'dishA'), dial(4), { join: ['h1', 'o1'] }, { join: ['h2', 'o1'] }],
  [lay('lens', 'dishA'), dial(4), { join: ['h1', 'o1'] }, { join: ['h2', 'o1'] }, { join: ['h3', 'o2'] }, { join: ['h4', 'o3'] }, { join: ['o2', 'o3'] }],
  [tray('h1', 'mix'), tray('o1', 'mix'), { join: ['h2', 'o2'] }, tray('h2', 'comp')],
  [
    lay('lens', 'm1'), dial(4), lift, { place: { piece: 'cutter', to: 'piece:m2' } },
    tray('m1', 'element'), tray('m2', 'compound'), tray('m3', 'mixed'), tray('m4', 'element')
  ]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [lay('lens', 'dishA'), dial(6)],
  [lay('lens', 'dishA'), lift, tray('dishA', 'more'), tray('dishB', 'one')],
  [{ place: { piece: 'a1', to: 'slot:rd' } }, tray('a1', 't1'), tray('a3', 't1'), tray('a4', 't2'), tray('a5', 't2'), tray('a2', 't3'), tray('a6', 't3')],
  [{ place: { piece: 'cutter', to: 'piece:t2' } }, tray('t2', 'safe')],
  [{ join: ['h1', 'o1'] }],
  [{ join: ['h1', 'o1'] }, { join: ['h2', 'o1'] }],
  [{ join: ['h1', 'o1'] }, tray('h1', 'mix'), tray('h2', 'comp'), tray('o2', 'comp')],
  [tray('m1', 'element'), tray('m2', 'compound'), tray('m3', 'mixed'), tray('m4', 'compound')]
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
