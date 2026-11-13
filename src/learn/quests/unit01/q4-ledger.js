/**
 * q4-ledger.js — Tallow, site four: THE LEDGER.
 *
 * The fourth game on the Learn road, and the fourth on the TABLETOP (plan `bench-tabletop.md`,
 * phase T2): the atom kit at PARTICLE scale, on the inspection deck beside the cracking tower's
 * sample cooler. The player describes an atom with three numbers — protons, neutrons and charge —
 * by BUILDING it: protons and neutrons are dragged into the middle, electrons onto the outside,
 * a charge needle reads the build live, and a stage is graded on what is on the table. The reward
 * card after each stage meets mass number, isotope notation, cations and anions.
 *
 *   1  build an atom particle for particle              -> Mass Number
 *   2  build a sealed sample from its label             -> Isotope Notation
 *   3  tray the samples that react like Sample A        -> Isotopes react alike
 *   4  build the protons and electrons of a sealed ion  -> Net charge
 *   5  take the outer shell off magnesium               -> Cations
 *   6  fill chlorine's outer shell                      -> Anions
 *   7  put ions on a pad until the needle reads zero    -> Charges cancel in whole numbers
 *   8  tray four samples against a reference            -> Three numbers describe any atom
 *
 * Every number on the table is a fact of the atom (`table/kits/atoms.js`): the needle is protons
 * against electrons (and an ion's own charge), a shell tray prints what it holds against what it can,
 * and nothing is declared. `SOLUTIONS` and `MISSES` are scripts of the player's own actions,
 * replayed by `verify:table`. The sealed samples read their labels, which are plates of printed lines.
 *
 * NO FIELD FETCH. Stage 1 once sent the player to the tower's sample cooler for a draw that was
 * Sample A again, so the walk carried nothing and was retired (problems doc U3).
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { atomTable, piecesIn, needleReading } from '../../table/kits/atoms.js';

export const meta = { stageCount: 8 };

/**
 * When each withheld word is earned. Everything the first three benches taught
 * is a plain word here. Nothing in this table is player-facing.
 */
export const VOCABULARY = [
  { term: /\bmass number\b/i, introducedAt: 1 },
  { term: /\bisotopes?\b/i, introducedAt: 3 },
  { term: /\bions?\b/i, introducedAt: 4 },
  { term: /\bcations?\b/i, introducedAt: 5 },
  { term: /\banions?\b/i, introducedAt: 6 }
];

const SPEAKER = 'Vess';

/**
 * The legend lines. Every key here is a piece dragged or a label that says what it is, so nothing owes
 * a legend. Kept so the quest contract (`toolNoteFor`) holds.
 */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE PARTS
   Protons and neutrons weigh one each, electrons almost nothing, and a proton and an electron push
   the needle opposite ways. Nothing on the table has been renamed since the core bench.
   ------------------------------------------------------------------ */
export const PARTS = {
  proton: { mass: 1.0, charge: 1 },
  neutron: { mass: 1.0, charge: 0 },
  electron: { mass: 0.0005, charge: -1 }
};

/** What the needle reads: protons against electrons. */
export function netCharge({ p, rings }) { return p - rings.reduce((a, b) => a + b, 0); }
/** Protons plus neutrons — the figure stamped on a sample label. */
export function massNumber({ p, n }) { return p + n; }

/* ------------------------------------------------------------------
   THE TABLES
   One layout (120 x 64 units): a row of samples along the top, the atom being built in the middle
   (the middle, the outside and the needle), the heap of loose particles bottom right and the
   scratch corner bottom left.
   ------------------------------------------------------------------ */

const NAMES = { proton: 'Proton', neutron: 'Neutron', electron: 'Electron' };

const part = (id, kind, x, y, zone = null) => ({ id, kind, label: NAMES[kind], at: { x, y }, ...(zone ? { zone } : {}) });
const electrons = (prefix, n, zone, from = 1) => Array.from({ length: n }, (_, i) => part(`${prefix}${from + i}`, 'electron', 0, 0, zone));
const trayAt = (id, label, x, y, w, h, cap) => ({ id, label, at: { x, y }, size: { w, h }, ...(cap != null ? { cap } : {}) });
const specimenTray = (id, label, x, y, w = 38) => ({ id, label, at: { x, y }, size: { w, h: 22 }, cell: 19 });
const specimen = (id, label, x, y, props) => ({ id, kind: 'specimen', label, at: { x, y }, props });
const nucleus = (id, label, x, y, p, n) => ({ id, kind: 'nucleus', label, at: { x, y }, fixed: true, props: { p, n } });
const plate = (id, label, x, lines) => ({ id, kind: 'plate', label, at: { x, y: 11 }, size: { w: 34, h: 16 }, noRun: true, props: { lines } });

/**
 * The heap of loose particles, two rows of six at the bottom right (y 49 and 59, clear of the scratch corner): `groups` is `[[kind, count], ...]`
 * in the order they lie. Ids run `p1..`, `n1..`, `e1..`.
 */
function heap(groups) {
  const out = [];
  const seen = { proton: 0, neutron: 0, electron: 0 };
  let k = 0;
  for (const [kind, count] of groups) {
    for (let i = 0; i < count; i++, k++) {
      seen[kind]++;
      out.push(part(`${kind[0]}${seen[kind]}`, kind, 60 + (k % 6) * 10, k < 6 ? 49 : 59));
    }
  }
  return out;
}

/** The atom being built: the middle, the outside rings and the charge & mass meters. */
const BUILD = {
  trays: [
    { ...trayAt('core', 'The middle', 36, 33, 12, 12), spot: true },
    { ...trayAt('out', '', 36, 33, 30, 20), orbit: { rings: [2, 8], radii: [10, 15] } }
  ],
  needle: { id: 'needle', kind: 'needle', label: 'Charge', at: { x: 80, y: 29 }, size: { w: 22, h: 17 }, noRun: true, props: { zones: ['tray:core', 'tray:out'], range: 4 } },
  mass: { id: 'mass', kind: 'mass', label: 'Mass', at: { x: 104, y: 29 }, size: { w: 22, h: 17 }, noRun: true, props: { zones: ['tray:core', 'tray:out'], range: 12 } }
};

const shellOrbit = (id, x, y, radius, cap, ringIndex, label = '') => ({
  ...trayAt(id, label, x, y, radius * 2, radius * 2, cap),
  orbit: { rings: [cap], radii: [radius], ringIndex }
});
const massFixture = (zones, nuc, at, range, size = { w: 22, h: 18 }) => ({
  id: 'mass', kind: 'mass', label: 'Mass', at, size, noRun: true, props: { zones, nucleus: nuc, range }
});
const needleFixture = (zones, nuc, at, range, size = { w: 22, h: 18 }) => ({
  id: 'needle', kind: 'needle', label: 'Charge', at, size, noRun: true, props: { zones, nucleus: nuc, range }
});

const count = (t, zone, kind) => piecesIn(t, zone, kind).length;
const shells = t => ['tray:sh1', 'tray:sh2', 'tray:sh3'].map(z => count(t, z, 'electron'));

/** A sample's reading, the way the table works it out: `{p, n, e}` of a specimen piece. */
const spec = p => ({ p: p.props.p, n: p.props.n, e: p.props.rings.reduce((a, b) => a + b, 0) });

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   Exported so `verify:learn` and `verify:table` can run SOLUTIONS and MISSES through every `check`.
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Three Numbers Off One Atom',
    briefing: {
      speaker: SPEAKER,
      body: 'The mass meter counts 1 for each proton and each neutron. The protons and neutrons together are the atom\'s mass number.'
    },
    prompt: 'Which particles, and how many of each, make up Sample A?',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        nucleus('refc', 'A MIDDLE', 14, 11, 3, 4),
        { ...specimen('refe', 'A OUTSIDE', 36, 11, { p: 3, n: 4, rings: [2, 1], needle: true }), fixed: true },
        ...heap([['proton', 4], ['neutron', 4], ['electron', 4]])
      ],
      zones: { trays: BUILD.trays },
      fixtures: [BUILD.needle, BUILD.mass]
    }),
    hints: [
      'Drag protons and neutrons into the middle, and electrons onto the rings outside.',
      'On Sample A, + is a proton, a blank disc is a neutron, and each outer dot is an electron.',
      'Check both meters: electrons equal protons when the charge meter reads zero.'
    ],
    check(state) {
      const t = state.table;
      const p = count(t, 'tray:core', 'proton');
      const n = count(t, 'tray:core', 'neutron');
      const e = count(t, 'tray:out', 'electron');
      if (p + n + e === 0) return { ok: false, notYet: true, msg: 'The atom is still empty. Drag particles into the middle and outside.' };
      if (p !== 3) return { ok: false, msg: 'Your middle holds a different number of protons than Sample A\'s.' };
      if (n !== 4) return { ok: false, msg: 'Your middle holds a different number of neutrons than Sample A\'s.' };
      if (e !== 3) return { ok: false, msg: 'Your outside holds a different number of electrons than Sample A\'s.' };
      return { ok: true };
    },
    reward: {
      log: 'Sample A: 3 protons, 4 neutrons, 3 electrons.',
      title: 'Mass Number',
      body: 'Three protons and four neutrons give mass number 7; the three electrons add almost nothing. This atom is lithium-7.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Read the Label',
    prompt: 'What is inside sealed Sample B, going by its label?',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        { ...specimen('sa', 'SAMPLE A', 14, 11, { p: 3, n: 4, rings: [2, 1], counts: true, needle: true }), fixed: true },
        { ...specimen('sb', 'SAMPLE B', 72, 11, { p: 3, n: 3, rings: [2, 1], casing: true }), fixed: true },
        ...heap([['proton', 3], ['neutron', 6], ['electron', 3]])
      ],
      zones: { trays: BUILD.trays },
      fixtures: [
        plate('la', 'Label A', 44, ['lithium (Li)', 'atomic number 3', 'mass number 7', 'charge 0']),
        plate('lb', 'Label B', 99, ['lithium (Li)', 'atomic number 3', 'mass number 6', 'charge 0']),
        BUILD.needle,
        BUILD.mass
      ]
    }),
    hints: [
      'Compare Label A with open Sample A, then build Sample B from Label B.',
      'Atomic number is the number of protons; charge is zero when electrons equal protons.',
      'The label gives the protons directly and the protons and neutrons together.'
    ],
    check(state) {
      const t = state.table;
      const p = count(t, 'tray:core', 'proton');
      const n = count(t, 'tray:core', 'neutron');
      const e = count(t, 'tray:out', 'electron');
      if (p + n + e === 0) return { ok: false, notYet: true, msg: 'The atom is still empty. Work the three counts out from the label.' };
      if (p !== 3) return { ok: false, msg: 'Your protons do not match the atomic number on Label B.' };
      if (n !== 3) return { ok: false, msg: `Your ${p} protons and ${n} neutrons make mass number ${p + n}, and Label B reads 6.` };
      if (e !== 3) return { ok: false, msg: 'Your charge meter does not match the charge on Label B.' };
      return { ok: true };
    },
    reward: {
      log: 'Sample B: 3 protons, 3 neutrons, 3 electrons.',
      model: { type: 'atoms', items: [{ p: 3, n: 4, label: 'Lithium-7' }, { p: 3, n: 3, label: 'Lithium-6' }], caption: 'Lithium-7 and lithium-6: 3 protons and 3 electrons each, 4 neutrons against 3. Not to scale.' },
      title: 'Isotope Notation',
      body: 'Atomic number 3 and mass number 6 mean three protons and three neutrons: lithium-6.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Which Ones React Alike',
    briefing: {
      speaker: SPEAKER,
      body: 'Atoms of one element with different numbers of neutrons are isotopes. Reactions involve only electrons, and a neutral atom has as many electrons as protons.'
    },
    prompt: 'Which samples react the same way as Sample A?',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        { ...specimen('ref', 'SAMPLE A', 14, 11, { p: 17, n: 18, rings: [2, 8, 7], counts: true }), fixed: true },
        specimen('k', 'SAMPLE B', 42, 11, { p: 17, n: 20, rings: [2, 8, 7], counts: true }),
        specimen('l', 'SAMPLE C', 70, 11, { p: 18, n: 18, rings: [2, 8, 8], counts: true }),
        specimen('m', 'SAMPLE D', 98, 11, { p: 16, n: 19, rings: [2, 8, 6], counts: true })
      ],
      zones: {
        trays: [
          specimenTray('same', 'Reacts like Sample A', 30, 40, 44),
          specimenTray('other', 'Reacts differently', 82, 40, 44)
        ]
      }
    }),
    hints: [
      'Compare the particle counts on each sample with Sample A.',
      'Look at whether two samples with different neutron counts still have the same outer shell.',
      'In neutral atoms, the number of protons sets the number of electrons.'
    ],
    check(state) {
      const t = state.table;
      const where = id => (t.pieces[id].zone || '').replace('tray:', '');
      const ids = ['k', 'l', 'm'];
      const labels = { k: 'Sample B', l: 'Sample C', m: 'Sample D' };
      for (const id of ids) if (!['same', 'other'].includes(where(id))) return { ok: false, notYet: true, msg: `${labels[id]} has no tray yet.` };
      const ref = spec(t.pieces.ref);
      const outer = id => {
        const r = spec(t.pieces[id]).rings;
        return r ? r[r.length - 1] : spec(t.pieces[id]).p;
      };
      for (const id of ids) {
        const alike = spec(t.pieces[id]).p === ref.p;
        if ((where(id) === 'same') !== alike) {
          return { ok: false, msg: `${labels[id]} has ${spec(t.pieces[id]).p} protons (${outer(id)} outer electrons); Sample A has ${ref.p} protons (${outer('ref')} outer electrons).` };
        }
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample B matches. Samples C and D do not.',
      title: 'Isotopes React Alike',
      body: 'The isotopes of chlorine have the same electrons, so they react alike. The sample with a different proton count does not.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'The Meter Is Not on Zero',
    briefing: {
      speaker: SPEAKER,
      body: 'An atom whose electrons do not equal its protons has a charge and is called an ion.'
    },
    prompt: 'How many protons and electrons does the sealed ion hold?',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        { ...specimen('sa', 'SAMPLE A', 14, 11, { p: 4, n: 5, rings: [2, 2], counts: true, needle: true }), fixed: true },
        { ...specimen('sb', 'SAMPLE B', 72, 11, { p: 3, n: 4, rings: [2], casing: true, needle: true }), fixed: true },
        ...heap([['proton', 4], ['electron', 3]])
      ],
      zones: { trays: BUILD.trays },
      fixtures: [
        plate('la', 'Label A', 44, ['beryllium (Be)', 'atomic number 4', 'mass number 9']),
        plate('lb', 'Label B', 99, ['lithium (Li)', 'atomic number 3', 'mass number 7']),
        BUILD.needle,
        BUILD.mass
      ]
    }),
    hints: [
      'Drag protons into the middle and electrons onto the rings, watching the charge meter.',
      'Compare open Sample A\'s counts with its charge meter.',
      'Each proton adds +1 and each electron adds −1 to the charge meter.'
    ],
    check(state) {
      const t = state.table;
      const p = count(t, 'tray:core', 'proton');
      const e = count(t, 'tray:out', 'electron');
      if (p === 0 && e === 0) return { ok: false, notYet: true, msg: 'The atom is still empty. Work out the protons and the electrons.' };
      if (p !== 3) return { ok: false, msg: 'Your protons do not match the atomic number on Label B.' };
      if (e === p) return { ok: false, msg: 'Your charge meter reads 0, and Sample B\'s does not.' };
      if (e > p) return { ok: false, msg: 'Your charge meter reads below 0, and Sample B\'s does not.' };
      if (e !== 2) return { ok: false, msg: 'Your charge meter does not match Sample B\'s.' };
      return { ok: true };
    },
    reward: {
      log: 'Sample B: 3 protons, 2 electrons, charge +1.',
      title: 'Net Charge',
      body: 'This charged atom is an ion: three protons and two electrons leave a charge of +1. It is still lithium-7.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Lose the Outer Shell',
    prompt: 'Remove magnesium\'s valence electrons to form its ion.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        nucleus('nuc', 'SAMPLE A', 38, 35, 12, 12),
        ...electrons('e', 2, 'tray:sh1'),
        ...electrons('e', 8, 'tray:sh2', 3),
        ...electrons('e', 2, 'tray:sh3', 11)
      ],
      zones: {
        trays: [
          trayAt('src', 'Taken off', 92, 47, 38, 20, 12),
          shellOrbit('sh1', 38, 35, 12, 2, 0, 'Shell 1'),
          shellOrbit('sh2', 38, 35, 17, 8, 1, 'Shell 2'),
          shellOrbit('sh3', 38, 35, 22, 8, 2, 'Shell 3')
        ]
      },
      fixtures: [
        needleFixture(['tray:sh1', 'tray:sh2', 'tray:sh3'], 'nuc', { x: 80, y: 18 }, 4),
        massFixture(['tray:sh1', 'tray:sh2', 'tray:sh3'], 'nuc', { x: 104, y: 18 }, 30)
      ]
    }),
    hints: [
      'Drag the valence electrons off magnesium\'s outer shell into the Taken off tray.',
      'Watch the charge meter and the shell lamp as the outer shell empties.',
      'Removing negatively charged electrons leaves the remaining ion positively charged.'
    ],
    check(state) {
      const [s1, s2, s3] = shells(state.table);
      const off = count(state.table, 'tray:src', 'electron');
      if (off === 0) return { ok: false, notYet: true, msg: 'Nothing has come off yet.' };
      if (s3 > 0) return { ok: false, msg: 'An electron is still on the third shell.' };
      if (s1 < 2 || s2 < 8) return { ok: false, msg: 'An inner shell has lost electrons, and its lamp is out.' };
      return { ok: true };
    },
    reward: {
      log: 'Magnesium outer shell gone at +2.',
      model: { type: 'atom', p: 12, n: 12, charge: 2, caption: 'A magnesium ion with a charge of +2: 12 protons and 10 electrons, on shells of 2 and 8. Not to scale.' },
      title: 'Cations and Full Shells',
      body: 'Without its two valence electrons magnesium has a charge of +2 and a full shell outermost. A positive ion is a cation.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Fill It Past Neutral',
    prompt: 'Add electrons to fill chlorine\'s outer shell and form its ion.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        nucleus('nuc', 'SAMPLE A', 38, 35, 17, 18),
        ...electrons('e', 2, 'tray:sh1'),
        ...electrons('e', 8, 'tray:sh2', 3),
        ...electrons('e', 7, 'tray:sh3', 11),
        ...electrons('e', 3, 'tray:src', 18)
      ],
      zones: {
        trays: [
          trayAt('src', 'Spare electrons', 92, 47, 38, 20, 3),
          shellOrbit('sh1', 38, 35, 12, 2, 0, 'Shell 1'),
          shellOrbit('sh2', 38, 35, 17, 8, 1, 'Shell 2'),
          shellOrbit('sh3', 38, 35, 22, 8, 2, 'Shell 3')
        ]
      },
      fixtures: [
        needleFixture(['tray:sh1', 'tray:sh2', 'tray:sh3'], 'nuc', { x: 80, y: 18 }, 4),
        massFixture(['tray:sh1', 'tray:sh2', 'tray:sh3'], 'nuc', { x: 104, y: 18 }, 40)
      ]
    }),
    hints: [
      'Drag spare electrons onto chlorine\'s outer shell.',
      'Watch the charge meter and the shell lamp as the outer shell fills.',
      'Adding negatively charged electrons beyond neutral gives the ion a negative charge.'
    ],
    check(state) {
      const [s1, s2, s3] = shells(state.table);
      if (s3 > 8 || s2 > 8 || s1 > 2) return { ok: false, msg: 'A shell holds more than its tray allows.' };
      const untouched = s3 === 7 && count(state.table, 'tray:src', 'electron') === 3;
      if (s3 < 8) return { ok: false, notYet: untouched, msg: 'The outer shell is not full yet.' };
      if (s1 < 2 || s2 < 8) return { ok: false, msg: 'An inner shell has room while a shell beyond it holds electrons.' };
      return { ok: true };
    },
    reward: {
      log: 'Chlorine loaded 2 / 8 / 8. Charge -1.',
      title: 'Anions',
      body: 'One more electron fills chlorine\'s outer shell and leaves a charge of −1. A negative ion is an anion.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Cancel The Charges',
    prompt: 'How many magnesium ions and chloride ions make a group with no charge?',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        ...[10, 20, 30].map((x, i) => ({ id: `a${i + 1}`, kind: 'ion', label: 'Mg²⁺', at: { x, y: 11 }, props: { el: 'Mg', charge: 2 } })),
        ...[56, 66, 76, 86, 96, 106].map((x, i) => ({ id: `b${i + 1}`, kind: 'ion', label: 'Cl⁻', at: { x, y: 11 }, props: { el: 'Cl', charge: -1 } }))
      ],
      zones: { trays: [trayAt('pad', 'Pad', 88, 35, 50, 22)] },
      fixtures: [{ id: 'needle', kind: 'needle', label: 'Pad charge', at: { x: 30, y: 34 }, size: { w: 44, h: 18 }, noRun: true, props: { zones: ['tray:pad'], range: 4 } }],
      opts: { atom3d: false }
    }),
    hints: [
      'Drag Mg²⁺ and Cl⁻ ions onto the pad and watch the Pad charge meter.',
      'Each Mg²⁺ adds +2 and each Cl⁻ adds −1 to the pad\'s total charge.',
      'Use the smallest whole-number combination whose charges add up to zero.'
    ],
    check(state) {
      const t = state.table;
      const s = piecesIn(t, 'tray:pad').filter(p => p.props.el === 'Mg').length;
      const u = piecesIn(t, 'tray:pad').filter(p => p.props.el === 'Cl').length;
      if (s === 0 && u === 0) return { ok: false, notYet: true, msg: 'The pad is still empty. Drag ions onto it.' };
      if (s === 0 || u === 0) return { ok: false, msg: 'The pad holds one kind of ion, and its charge meter cannot reach 0 with that.' };
      const net = needleReading(t, 'needle');
      if (net !== 0) return { ok: false, msg: `The pad reads ${net > 0 ? '+' : '-'}${Math.abs(net)}.` };
      if (s !== 1 || u !== 2) return { ok: false, msg: 'That combination balances, and a smaller one does too.' };
      return { ok: true };
    },
    reward: {
      log: 'One Mg²⁺ to two Cl⁻. Charge zero.',
      title: 'Charges Cancel In Whole Numbers',
      body: 'One Mg²⁺ needs two Cl⁻ to reach zero, so the compound is MgCl₂.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'File Them All',
    prompt: 'How does each sample differ from Sample A?',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        { ...specimen('std', 'SAMPLE A', 11, 11, { p: 8, n: 8, rings: [2, 6], counts: true, needle: true }), fixed: true },
        specimen('n1', 'SAMPLE B', 34, 11, { p: 8, n: 10, rings: [2, 6], counts: true, needle: true }),
        specimen('n2', 'SAMPLE C', 57, 11, { p: 8, n: 8, rings: [2, 8], counts: true, needle: true }),
        specimen('n3', 'SAMPLE D', 80, 11, { p: 7, n: 9, rings: [2, 5], counts: true, needle: true }),
        specimen('n4', 'SAMPLE E', 103, 11, { p: 8, n: 8, rings: [2, 6], counts: true, needle: true })
      ],
      zones: {
        trays: [
          specimenTray('match', 'Identical', 17, 37, 27),
          specimenTray('heavy', 'Isotope', 46, 37, 27),
          specimenTray('charged', 'Ion', 75, 37, 27),
          specimenTray('other', 'Different element', 104, 37, 27)
        ]
      }
    }),
    hints: [
      'Compare each sample\'s protons, neutrons and charge meter with Sample A.',
      'Find the one count that differs from Sample A for each sample.',
      'Only one of the three counts differs for each sample; name what that count decides.'
    ],
    check(state) {
      const t = state.table;
      const where = id => (t.pieces[id].zone || '').replace('tray:', '');
      const ids = ['n1', 'n2', 'n3', 'n4'];
      const labels = { n1: 'Sample B', n2: 'Sample C', n3: 'Sample D', n4: 'Sample E' };
      const trays = ['match', 'heavy', 'charged', 'other'];
      for (const id of ids) if (!trays.includes(where(id))) return { ok: false, notYet: true, msg: `${labels[id]} has no tray yet.` };
      const ref = spec(t.pieces.std);
      const kind = id => {
        const s = spec(t.pieces[id]);
        if (s.p !== ref.p) return 'other';
        if (s.n !== ref.n) return 'heavy';
        if (s.p - s.e !== ref.p - ref.e) return 'charged';
        return 'match';
      };
      for (const id of ids) {
        if (where(id) !== kind(id)) {
          return { ok: false, msg: `${labels[id]}'s tray does not match how it differs from the reference.` };
        }
      }
      return { ok: true };
    },
    reward: {
      log: 'All four filed.',
      title: 'Three Numbers Describe Any Atom',
      body: 'A different neutron count is an isotope, a different electron count is an ion, and a different proton count is another element.',
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
      body: 'Any atom is described by three numbers: how many protons, how many neutrons, and what charge it carries. Protons plus neutrons is the mass number.'
    },
    {
      heading: 'What Each Number Does',
      body: 'Change the protons and it is a different element. Change the neutrons and it is an isotope, which behaves exactly the same. Change the electrons and it is an ion: a cation if you took some off, an anion if you put some on.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const to = (piece, target) => ({ place: { piece, to: target } });
const moveAll = (ids, zone) => ids.map(id => to(id, zone));
const ids = (prefix, from, upto) => Array.from({ length: upto - from + 1 }, (_, i) => `${prefix}${from + i}`);

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [...moveAll(ids('p', 1, 3), 'tray:core'), ...moveAll(ids('n', 1, 4), 'tray:core'), ...moveAll(ids('e', 1, 3), 'tray:out')],
  [...moveAll(ids('p', 1, 3), 'tray:core'), ...moveAll(ids('n', 1, 3), 'tray:core'), ...moveAll(ids('e', 1, 3), 'tray:out')],
  [to('k', 'tray:same'), to('l', 'tray:other'), to('m', 'tray:other')],
  [...moveAll(ids('p', 1, 3), 'tray:core'), ...moveAll(ids('e', 1, 2), 'tray:out')],
  moveAll(['e11', 'e12'], 'tray:src'),
  [to('e18', 'tray:sh3')],
  [to('a1', 'tray:pad'), to('b1', 'tray:pad'), to('b2', 'tray:pad')],
  [to('n1', 'tray:heavy'), to('n2', 'tray:charged'), to('n3', 'tray:other'), to('n4', 'tray:match')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [...moveAll(ids('p', 1, 4), 'tray:core'), ...moveAll(ids('n', 1, 3), 'tray:core'), ...moveAll(ids('e', 1, 3), 'tray:out')],
  [...moveAll(ids('p', 1, 3), 'tray:core'), ...moveAll(ids('n', 1, 6), 'tray:core'), ...moveAll(ids('e', 1, 3), 'tray:out')],
  [to('k', 'tray:other'), to('l', 'tray:other'), to('m', 'tray:same')],
  [...moveAll(ids('p', 1, 3), 'tray:core'), ...moveAll(ids('e', 1, 3), 'tray:out')],
  [to('e11', 'tray:src')],
  moveAll(['e18', 'e19'], 'tray:sh3'),
  [to('a1', 'tray:pad'), to('a2', 'tray:pad'), to('b1', 'tray:pad'), to('b2', 'tray:pad'), to('b3', 'tray:pad'), to('b4', 'tray:pad')],
  [to('n1', 'tray:heavy'), to('n2', 'tray:match'), to('n3', 'tray:other'), to('n4', 'tray:match')]
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
