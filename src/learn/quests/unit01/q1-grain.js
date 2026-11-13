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
 * NO FIELD FETCH. Stage 1 once sent the player to the conveyor tail for a scoop that held the same
 * atoms, in the same count, as Sample A. That was carrying, not evidence, so it was retired
 * (problems doc U3): a fetch stays only where what is fetched is new evidence.
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
  { term: /\b(molecules?|molecular)\b/i, introducedAt: 4 },
  { term: /\bcompounds?\b/i, introducedAt: 6 },
  { term: /\bmixtures?\b/i, introducedAt: 7 }
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
    prompt: 'How far must you zoom in before Sample A shows separate particles?',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        dishAt('dishA', 'SAMPLE A', sample('c7', 4, [{ kinds: ['k06'], n: 46 }]), 24),
        tool('lens', 'Lens')
      ],
      fixtures: [scopeFixture]
    }),
    hints: [
      'Drag the lens over Sample A and turn the Power dial.',
      'Compare the picture at neighbouring powers: what changes between them, and what only gets bigger?',
      'Find the first power where single particles appear; one step lower should still look like clumps.'
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
      body: 'Zoomed in far enough, the sample is not smooth: it is made of separate particles called atoms.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'One Kind or Two?',
    briefing: {
      speaker: SPEAKER,
      body: 'An element is a substance made of only one kind of atom. Look at the atoms in each sample through the lens.'
    },
    prompt: 'Which samples are elements?',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        dishAt('dishA', 'SAMPLE A', sample('c09', 4, [{ kinds: ['k06'], n: 44 }]), 8),
        dishAt('dishB', 'SAMPLE B', sample('c14', 4, [{ kinds: ['k06'], n: 26 }, { kinds: ['k11'], n: 18 }]), 29),
        dishAt('dishC', 'SAMPLE C', sample('c21', 4, [{ kinds: ['k06'], n: 30 }, { kinds: ['k11'], n: 14 }]), 50),
        dishAt('dishD', 'SAMPLE D', sample('c33', 4, [{ kinds: ['k11'], n: 42 }]), 71),
        tool('lens', 'Lens')
      ],
      zones: {
        trays: [
          dishTray('one', 'Element', 22, 34, 40),
          dishTray('more', 'Not an element', 66, 34, 40)
        ]
      },
      fixtures: [scopeFixture]
    }),
    hints: [
      'Use the lens on each sample, at a power where single atoms show.',
      'Compare the atoms within one picture by tint and size.',
      'A sample is an element only if every atom you can find in it matches every other.'
    ],
    check(state) {
      const t = state.table;
      const one = dishIn(t, 'one');
      const more = dishIn(t, 'more');
      if (!one.length && !more.length) return { ok: false, notYet: true, msg: 'Put all four samples in a tray before you submit.' };
      if (one.length + more.length < 4) return { ok: false, notYet: true, msg: 'Put all four samples in a tray before you submit.' };
      if (one.join() === 'dishA,dishD' && more.join() === 'dishB,dishC') return { ok: true };
      const bad = [...one.filter(id => id === 'dishB' || id === 'dishC').map(() => 'Element'), ...more.filter(id => id === 'dishA' || id === 'dishD').map(() => 'Not an element')];
      const trays = [...new Set(bad)];
      return { ok: false, msg: `The "${trays[0]}" tray holds a sample whose atoms do not fit its label${trays.length > 1 ? ', and so does the other tray' : ''}.` };
    },
    reward: {
      log: 'A and D hold one kind of atom each. B and C mix two kinds.',
      title: 'Elements',
      body: 'In an element every atom matches every other. The other samples hold two kinds of atom.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Count the Elements',
    briefing: {
      speaker: SPEAKER,
      body: 'Atoms of different elements can look alike, but each element has its own mass. Drop an atom in the scale slot to weigh it, then sort the atoms so each tray holds one element.'
    },
    prompt: 'Sort these atoms so each element sits in its own tray.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        // Sodium and magnesium are dressed alike on purpose: only the scale tells them apart.
        atomAt('a1', 'Na', 12, 10, { mask: true, tint: 'pale' }),
        atomAt('a2', 'C', 26, 10, { mask: true }),
        atomAt('a3', 'Mg', 40, 10, { mask: true, tint: 'pale' }),
        atomAt('a4', 'Mg', 12, 24, { mask: true, tint: 'pale' }),
        atomAt('a5', 'Na', 26, 24, { mask: true, tint: 'pale' }),
        atomAt('a6', 'C', 40, 24, { mask: true })
      ],
      zones: {
        slots: [{ id: 'rd', label: 'Scale slot', at: { x: 66, y: 12 } }],
        trays: [
          trayAt('t1', 'Tray 1', 17, 50, 26, 16),
          trayAt('t2', 'Tray 2', 45, 50, 26, 16),
          trayAt('t3', 'Tray 3', 73, 50, 26, 16),
          trayAt('t4', 'Tray 4', 101, 50, 26, 16)
        ]
      },
      fixtures: [{ id: 'reader', kind: 'reader', label: 'Scale', at: { x: 98, y: 14 }, size: { w: 36, h: 14 }, noRun: true, props: { slot: 'rd' } }],
      notes: [{ at: { x: 4, y: 36 }, text: 'Put an atom in the scale slot to read its mass.' }]
    }),
    hints: [
      'Drop an atom in the scale slot to see its mass.',
      'Two kinds look the same through the lens; compare their masses.',
      'Weigh any atoms that look alike, then group atoms of the same mass into one tray.'
    ],
    check(state) {
      const t = state.table;
      const atoms = Object.values(t.pieces).filter(p => p.kind === 'atom' && !p.props.scratch);
      const filed = atoms.filter(p => p.zone && p.zone.startsWith('tray:'));
      if (filed.length < atoms.length) return { ok: false, notYet: true, msg: 'Every atom needs a tray before you submit.' };
      const byTray = {};
      for (const p of filed) (byTray[p.zone] ||= new Set()).add(p.props.el);
      const mixedTray = Object.entries(byTray).find(([, set]) => set.size > 1);
      if (mixedTray) {
        const label = t.zones.trays[mixedTray[0].replace('tray:', '')]?.label || mixedTray[0];
        return { ok: false, msg: `${label} holds atoms of more than one element.` };
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
      body: 'Atoms of one element all have the same mass here, and atoms of different elements differ. Two that look alike can be told apart on a scale.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'What Cannot Be Split',
    briefing: {
      speaker: SPEAKER,
      body: 'Atoms can be joined by bonds; a group of atoms bonded together is a molecule. Lay the Break bonds tool on a dish to break every bond in it.'
    },
    prompt: 'Which sample has no bonds to break?',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        dishAt('t1', 'SAMPLE A', sample('t1', 1, [{ kinds: ['k06'], n: 20 }], 1.5), 14, 12, true),
        dishAt('t2', 'SAMPLE B', sample('t2', 1, [{ ...CLUSTER_A, n: 1 }], 3.6), 36, 12, true),
        dishAt('t3', 'SAMPLE C', sample('t3', 1, [{ ...PAIR_LIGHT, n: 1 }], 3.6), 58, 12, true),
        dishAt('t4', 'SAMPLE D', sample('t4', 1, [{ kinds: ['k02'], n: 1 }], 3.6), 80, 12, true),
        tool('cutter', 'Break bonds')
      ],
      zones: { trays: [dishTray('safe', 'No bonds', 47, 38, 40)] }
    }),
    hints: [
      'Drag the Break bonds tool onto each dish in turn.',
      'Compare each picture before and after using the tool to see where bonds broke.',
      'The sample that did not change had no bonds holding its atoms together.'
    ],
    check(state) {
      const safe = dishIn(state.table, 'safe');
      if (!safe.length) return { ok: false, notYet: true, msg: 'Put a sample in the tray first.' };
      if (safe.join() === 't4') return { ok: true };
      return { ok: false, msg: 'That sample\'s picture changed when its bonds broke.' };
    },
    reward: {
      log: 'A single helium atom has no bonds to break.',
      title: 'Atoms Do Not Split',
      body: 'Three molecules came apart into single atoms. The fourth was a single atom already, and breaking bonds cannot split an atom.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Copy the Molecule',
    briefing: {
      speaker: SPEAKER,
      body: 'Look at Sample A through the lens. The atom labels C, H and O stand for carbon, hydrogen and oxygen.'
    },
    prompt: 'Build one molecule of Sample A from the loose atoms.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        dishAt('dishA', 'SAMPLE A', sample('v9', 4, [{ ...CLUSTER_A, n: 20 }], 1.5), 24),
        ...heap(36, [['c1', 'C'], ['h1', 'H'], ['o1', 'O'], ['h2', 'H'], ['o2', 'O'], ['h3', 'H'], ['h4', 'H']], 10, 11),
        tool('lens', 'Lens')
      ],
      fixtures: [scopeFixture],
      notes: JOIN_NOTES,
      opts: { atom3d: false }
    }),
    hints: [
      'Use the lens on Sample A, then join loose atoms.',
      'Every molecule here is the same, so look at just one: the atom in the middle and each atom joined to it.',
      'Count how many of each element are in that molecule and join the same atoms.'
    ],
    check(state) {
      const mols = moleculesOf(state.table);
      if (!mols.length) return { ok: false, notYet: true, msg: 'Join some atoms together first.' };
      if (mols.some(m => m.counts.H === 2 && m.counts.O === 1 && Object.keys(m.counts).length === 2)) return { ok: true };
      if (mols.some(m => m.counts.C)) return { ok: false, msg: 'A molecule on the table holds carbon, and the lens shows none in Sample A.' };
      if (mols.some(m => m.counts.H && m.counts.O)) return { ok: false, msg: 'Your molecule and the lens picture disagree on how many atoms of one element it holds.' };
      return { ok: false, msg: 'Your molecule holds one element; the lens picture shows two.' };
    },
    reward: {
      log: 'Copy built: 1 x oxygen, 2 x hydrogen.',
      title: 'Water, H2O',
      body: 'Each molecule here is one oxygen atom bonded to two hydrogen atoms: water, H₂O.',
      model: { type: 'molecule', name: 'water' }
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Same Elements, Different Compound',
    briefing: {
      speaker: SPEAKER,
      body: 'A compound is a substance made of two or more elements bonded together. Its formula counts the atoms of each element in one molecule: water is H₂O.'
    },
    prompt: 'Build one molecule of Sample A and one of Sample B.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        dishAt('dishA', 'SAMPLE A', sample('vA', 4, [{ ...CLUSTER_A, n: 16 }], 1.5), 24),
        dishAt('dishB', 'SAMPLE B', sample('vB', 4, [{ ...CLUSTER_B, n: 14 }], 1.5), 48),
        ...heap(36, [['h1', 'H'], ['o1', 'O'], ['h2', 'H'], ['o2', 'O'], ['h3', 'H'], ['o3', 'O'], ['h4', 'H']], 10, 11),
        tool('lens', 'Lens')
      ],
      fixtures: [scopeFixture],
      notes: JOIN_NOTES,
      opts: { atom3d: false }
    }),
    hints: [
      'Use the lens on each sample, then join loose atoms.',
      'Both samples hold only hydrogen and oxygen, so compare how many of each atom sit in one molecule.',
      'Count the oxygen and hydrogen atoms in a molecule of each sample and match those counts.'
    ],
    check(state) {
      const mols = moleculesOf(state.table);
      const has = (h, o) => mols.some(m => m.counts.H === h && m.counts.O === o && Object.keys(m.counts).length === 2);
      if (!mols.length) return { ok: false, notYet: true, msg: 'Build a molecule of each sample before you submit.' };
      if (has(2, 1) && has(2, 2)) return { ok: true };
      if (!has(2, 1)) return { ok: false, msg: 'No molecule on the table matches one molecule of Sample A in the lens.' };
      return { ok: false, msg: 'No molecule on the table matches one molecule of Sample B in the lens.' };
    },
    reward: {
      log: 'Sample A: H2O. Sample B: H2O2.',
      title: 'Compounds',
      body: 'H₂O and H₂O₂ are made of the same two elements in different counts, so they are different compounds.',
      model: { type: 'molecule', name: 'peroxide', caption: 'H₂O₂: the same two elements as water, in a different formula.' }
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Mixture or Compound?',
    briefing: {
      speaker: SPEAKER,
      body: 'In a mixture, different substances lie side by side with no bonds between them.'
    },
    prompt: 'Make a mixture in one tray and a compound in the other.',
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
      ],
      opts: { atom3d: false }
    }),
    hints: [
      'Use both trays, and join atoms by dropping one onto another.',
      'Look at whether the atoms in each tray are bonded together or lying loose side by side.',
      'Check both trays: both need hydrogen and oxygen, differing only in whether the atoms are bonded.'
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
      if (els(mix).size < 2) return { ok: false, msg: 'The Mixture tray holds one kind of atom.' };
      if (joinedWithin(mix)) return { ok: false, msg: 'Atoms in the Mixture tray are joined to each other.' };
      const molecule = moleculesOf(t).some(m => Object.keys(m.counts).length > 1 && m.ids.every(id => t.pieces[id].zone === 'tray:comp'));
      if (!molecule) return { ok: false, msg: 'The Compound tray holds no joined group of different atoms.' };
      return { ok: true };
    },
    reward: {
      log: 'Same atoms: loose in a mixture, joined in a compound.',
      title: 'Mixture or Compound?',
      body: 'Loose side by side, the atoms are a mixture. Bonded together, the same atoms are a compound.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Sort Them All',
    prompt: 'Sort the four samples into Element, Compound and Mixture.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        dishAt('m1', 'SAMPLE A', sample('m1', 4, [{ kinds: ['k06'], n: 24 }]), 11),
        dishAt('m2', 'SAMPLE B', sample('m2', 4, [{ ...CLUSTER_A, n: 18 }]), 31),
        dishAt('m3', 'SAMPLE C', sample('m3', 4, [{ kinds: ['k06'], n: 12 }, { kinds: ['k16'], n: 12 }]), 51),
        dishAt('m4', 'SAMPLE D', sample('m4', 4, [{ ...PAIR_LIGHT, n: 18 }]), 71),
        tool('lens', 'Lens'),
        tool('cutter', 'Break bonds')
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
      'Use the lens on each sample, and the Break bonds tool to test for bonds.',
      'For each sample, check how many kinds of atom it holds and whether its atoms are bonded.',
      'A sample can have bonds and still be an element, so settle the kinds of atom first.'
    ],
    check(state) {
      const t = state.table;
      const where = {};
      for (const tray of ['element', 'compound', 'mixed']) for (const id of dishIn(t, tray)) where[id] = tray;
      if (['m1', 'm2', 'm3', 'm4'].some(id => !where[id])) return { ok: false, notYet: true, msg: 'Put all four samples in a tray before you submit.' };
      const want = { m1: 'element', m2: 'compound', m3: 'mixed', m4: 'element' };
      const wrong = Object.keys(want).filter(k => where[k] !== want[k]);
      if (!wrong.length) return { ok: true };
      const names = { element: 'Element', compound: 'Compound', mixed: 'Mixture' };
      const trays = [...new Set(wrong.map(k => names[where[k]]))];
      return { ok: false, msg: `The ${trays.join(' and ')} ${trays.length > 1 ? 'trays hold' : 'tray holds'} a sample whose picture does not fit.` };
    },
    reward: {
      log: 'All four filed correctly.',
      title: 'Elements, Compounds, and Mixtures',
      last: true,
      body: 'One kind of atom is an element, and different elements bonded are a compound. Different substances not bonded to each other are a mixture.'
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
      body: 'Matter is made of atoms. A substance with one kind of atom is an element, bonded different elements form a compound, and unbonded atoms form a mixture.'
    }
  ]
};

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
  [lay('lens', 'dishA'), dial(4)],
  [lay('lens', 'dishA'), dial(4), lift, tray('dishA', 'one'), lay('lens', 'dishB'), lift, tray('dishB', 'more'), tray('dishC', 'more'), tray('dishD', 'one')],
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
  [lay('lens', 'dishA'), lift, tray('dishA', 'one'), tray('dishB', 'more'), tray('dishC', 'one'), tray('dishD', 'one')],
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
