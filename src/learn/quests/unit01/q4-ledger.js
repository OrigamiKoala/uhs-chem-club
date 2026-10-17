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
 * FIELD (stage 1). A sample can be drawn from the tower's sample cooler; the field point is a real
 * piece of the host (`tallow/stations.js` `buildTowerDeck`). It is evidence, never a lock: the stage
 * is answered with the bench's own Sample A, and at T1 to T3 the same fetch is a drawn site plate.
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
const plate = (id, label, x, lines) => ({ id, kind: 'plate', label, at: { x, y: 12 }, size: { w: 34, h: 18 }, noRun: true, props: { lines } });

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

/** The atom being built: the middle, the outside and the needle clipped on both. */
const BUILD = {
  trays: [trayAt('core', 'The middle', 23, 34, 40, 20), trayAt('out', 'Outside', 57, 34, 22, 20)],
  needle: { id: 'needle', kind: 'needle', label: 'Needle', at: { x: 94, y: 33 }, size: { w: 44, h: 18 }, noRun: true, props: { zones: ['tray:core', 'tray:out'], range: 4 } }
};

/** The shell trays of an atom with a nucleus at the top left: one per shell, closest in first. */
const SHELLS = [
  trayAt('sh1', 'Shell 1', 14, 34, 20, 16, 2),
  trayAt('sh2', 'Shell 2', 48, 34, 40, 20, 8),
  trayAt('sh3', 'Shell 3', 92, 49, 40, 20, 8)
];
const SOURCE_TRAY = (label, n) => trayAt('src', label, 98, 18, 40, 30, n);
const needleFixture = (zones, nuc, at, range) => ({
  id: 'needle', kind: 'needle', label: 'Needle', at, size: { w: 40, h: 16 }, noRun: true, props: { zones, nucleus: nuc, range }
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
      body: 'This bench builds an atom from loose particles: drag them into the middle or outside, and a needle reads the charge. A sample from the tower\'s cooler is waiting at the skid.'
    },
    prompt: 'Build an atom that matches Sample A, particle for particle.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        nucleus('refc', 'A MIDDLE', 14, 12, 3, 4),
        { ...specimen('refe', 'A OUTSIDE', 36, 12, { p: 3, n: 4, rings: [2, 1], needle: true }), fixed: true },
        { ...specimen('draw', 'COOLER DRAW', 62, 12, { p: 3, n: 4, rings: [2, 1] }), fixed: true, hidden: true, fetchFrom: 'cooler' },
        ...heap([['proton', 4], ['neutron', 4], ['electron', 4]])
      ],
      zones: { trays: BUILD.trays },
      fixtures: [BUILD.needle],
      fetch: [{ id: 'cooler', label: 'Cooler draw', at: { x: 100, y: 12 } }]
    }),
    hints: [
      'Drag a particle from the heap into the middle or outside, and watch the needle.',
      'In the middle of Sample A a disc with a + is a proton and a blank disc is a neutron, and each dot on a ring outside is an electron.',
      'Tally the + discs, then the blank ones, then the electrons on the rings, and check that the electrons equal the protons, since the needle reads zero.'
    ],
    check(state) {
      const t = state.table;
      const p = count(t, 'tray:core', 'proton');
      const n = count(t, 'tray:core', 'neutron');
      const e = count(t, 'tray:out', 'electron');
      if (p + n + e === 0) return { ok: false, notYet: true, msg: 'The atom is still empty. Drag particles into the middle and outside.' };
      if (p !== 3) return { ok: false, msg: 'Count the + discs in the middle of Sample A again. Each + marks a proton.' };
      if (n !== 4) return { ok: false, msg: 'The neutrons are the blank discs in the middle without a +.' };
      if (e !== 3) return { ok: false, msg: 'Count the electrons on the rings outside Sample A. Its needle reads zero, so they balance the protons.' };
      return { ok: true };
    },
    reward: {
      log: 'Sample A: 3 protons, 4 neutrons, 3 electrons.',
      title: 'Mass Number',
      body: 'Electrons weigh almost nothing, so everything an atom weighs is in its nucleus. Add the protons to the neutrons and you get 7, which is called the mass number. This atom is written lithium-7.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Read the Label',
    prompt: 'Build sealed Sample B from its label.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        { ...specimen('sa', 'SAMPLE A', 14, 12, { p: 3, n: 4, rings: [2, 1], counts: true, needle: true }), fixed: true },
        { ...specimen('sb', 'SAMPLE B', 72, 12, { p: 3, n: 3, rings: [2, 1], casing: true }), fixed: true },
        ...heap([['proton', 3], ['neutron', 6], ['electron', 3]])
      ],
      zones: { trays: BUILD.trays },
      fixtures: [
        plate('la', 'Label A', 44, ['lithium (Li)', 'atomic number 3', 'mass number 7', 'needle 0']),
        plate('lb', 'Label B', 99, ['lithium (Li)', 'atomic number 3', 'mass number 6', 'needle 0']),
        BUILD.needle
      ]
    }),
    hints: [
      'Read the open sample\'s counts against its label, then drag particles from the heap to build the sealed one.',
      'On the open sample the atomic number is the proton count, and the mass number is the protons and neutrons together.',
      'Take the atomic number from the mass number to find the neutrons, and match the electrons to the protons for a needle on zero.'
    ],
    check(state) {
      const t = state.table;
      const p = count(t, 'tray:core', 'proton');
      const n = count(t, 'tray:core', 'neutron');
      const e = count(t, 'tray:out', 'electron');
      if (p + n + e === 0) return { ok: false, notYet: true, msg: 'The atom is still empty. Work the three counts out from the label.' };
      if (p !== 3) return { ok: false, msg: 'Compare the open sample\'s atomic number with the protons you counted on it, then read the atomic number on the sealed label.' };
      if (n === 6) return { ok: false, msg: 'That number counts the protons too. Take the protons off it first.' };
      if (n !== 3) return { ok: false, msg: 'Work it out on the open sample first: compare the protons and neutrons you counted with the two numbers on its label, then do the same sum with the sealed label.' };
      if (e !== 3) return { ok: false, msg: 'A needle on zero means the electrons match the protons one for one.' };
      return { ok: true };
    },
    reward: {
      log: 'Sample B: 3 protons, 3 neutrons, 3 electrons.',
      title: 'Isotope Notation',
      body: 'Two numbers describe any atom: the atomic number, which says which element it is, and the mass number, which says how heavy this one is. Chemists write that as lithium-6, or as the mass number above the atomic number beside the symbol. Every other count falls out of the pair.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Which Ones Behave Alike',
    prompt: 'Tray each sample by whether it reacts the same way as Sample A.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        { ...specimen('ref', 'SAMPLE A', 14, 12, { p: 17, n: 18, rings: [2, 8, 7], counts: true }), fixed: true },
        specimen('k', 'SAMPLE B', 42, 12, { p: 17, n: 20, rings: [2, 8, 7], counts: true }),
        specimen('l', 'SAMPLE C', 70, 12, { p: 18, n: 18, rings: [2, 8, 8], counts: true }),
        specimen('m', 'SAMPLE D', 98, 12, { p: 16, n: 19, rings: [2, 8, 6], counts: true })
      ],
      zones: {
        trays: [
          specimenTray('same', 'Reacts the same way', 30, 36, 44),
          specimenTray('other', 'Reacts differently', 82, 36, 44)
        ]
      }
    }),
    hints: [
      'Compare the printed counts: the protons say which element a sample is.',
      'Count the protons and the outer-shell dots on each sample and compare them with Sample A.',
      'Tray a sample with Sample A only when its protons match, whatever its neutrons add up to.'
    ],
    check(state) {
      const t = state.table;
      const where = id => (t.pieces[id].zone || '').replace('tray:', '');
      const ids = ['k', 'l', 'm'];
      const labels = { k: 'Sample B', l: 'Sample C', m: 'Sample D' };
      for (const id of ids) if (!['same', 'other'].includes(where(id))) return { ok: false, notYet: true, msg: `${labels[id]} has no tray yet.` };
      const ref = spec(t.pieces.ref);
      for (const id of ids) {
        const alike = spec(t.pieces[id]).p === ref.p;
        if ((where(id) === 'same') !== alike) {
          return { ok: false, msg: alike
            ? `${labels[id]} is in the wrong tray. Compare its protons with Sample A's: they decide which element it is.`
            : `${labels[id]} is in the wrong tray. Count its protons and compare them with Sample A's.` };
        }
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample B matches. Samples C and D do not.',
      title: 'Isotopes React Alike',
      body: 'Isotopes of an element differ only in neutrons, and neutrons take no part in chemistry. The same proton count means the same electrons, the same outer shell and the same behaviour. That is why chlorine-35 and chlorine-37 are interchangeable in a reaction.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'The Needle Is Not on Zero',
    prompt: 'Build the protons and electrons of the sealed ion.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        { ...specimen('sa', 'SAMPLE A', 14, 12, { p: 4, n: 5, rings: [2, 2], counts: true, needle: true }), fixed: true },
        { ...specimen('sb', 'SAMPLE B', 72, 12, { p: 3, n: 4, rings: [2], casing: true, needle: true }), fixed: true },
        ...heap([['proton', 4], ['electron', 3]])
      ],
      zones: { trays: BUILD.trays },
      fixtures: [
        plate('la', 'Label A', 44, ['beryllium (Be)', 'atomic number 4', 'mass number 9']),
        plate('lb', 'Label B', 99, ['lithium (Li)', 'atomic number 3', 'mass number 7']),
        BUILD.needle
      ]
    }),
    hints: [
      'Drag protons and electrons from the heap into the middle and outside, and compare your needle with the sealed sample\'s.',
      'On the open sample the needle equals its protons minus its electrons, and its proton count equals its atomic number.',
      'Take the protons from the sealed label\'s atomic number, read its needle, and take the needle reading away from the protons to get the electrons.'
    ],
    check(state) {
      const t = state.table;
      const p = count(t, 'tray:core', 'proton');
      const e = count(t, 'tray:out', 'electron');
      if (p === 0 && e === 0) return { ok: false, notYet: true, msg: 'The atom is still empty. Work out the protons and the electrons.' };
      if (p !== 3) return { ok: false, msg: 'Compare the open sample\'s atomic number with the protons you counted on it, then read the atomic number on the sealed label.' };
      if (e === p) return { ok: false, msg: 'That many electrons would cancel the protons exactly and put the needle on zero. Read the sealed sample\'s needle.' };
      if (e > p) return { ok: false, msg: 'More electrons than protons would push the needle below zero. Read the sealed sample\'s needle.' };
      if (e !== 2) return { ok: false, msg: 'Read the sealed sample\'s needle: it says how many more protons than electrons it holds.' };
      return { ok: true };
    },
    reward: {
      log: 'Sample B: 3 protons, 2 electrons, needle plus one.',
      title: 'Net Charge',
      body: 'The needle does one subtraction: protons count up, electrons count down, and what is left over is the net charge. Nothing in the lithium nucleus has changed, so it is still atomic number 3 and still mass number 7. It is simply one electron short.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Lose the Outer Shell',
    prompt: 'Take every electron off magnesium\'s outermost shell.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        nucleus('nuc', 'SAMPLE A', 14, 12, 12, 12),
        ...electrons('e', 2, 'tray:sh1'),
        ...electrons('e', 8, 'tray:sh2', 3),
        ...electrons('e', 2, 'tray:sh3', 11)
      ],
      zones: { trays: [SOURCE_TRAY('Taken off', 12), ...SHELLS] },
      fixtures: [needleFixture(['tray:sh1', 'tray:sh2', 'tray:sh3'], 'nuc', { x: 50, y: 13 }, 4)]
    }),
    hints: [
      'Drag electrons off the shells and into the tray, and watch the needle.',
      'Magnesium starts with two electrons on its outermost shell, and each tray prints how many it holds against how many it can.',
      'Take electrons off one at a time and watch the needle after each, and stop when the outer shell is empty and the shell beneath it is still full.'
    ],
    check(state) {
      const [s1, s2, s3] = shells(state.table);
      const off = count(state.table, 'tray:src', 'electron');
      if (off === 0) return { ok: false, notYet: true, msg: 'Nothing has come off yet. Drag electrons off the outer shell and read the needle.' };
      if (s3 > 0) return { ok: false, msg: 'At this charge there is still an electron on the third shell. Take further electrons off to empty that shell.' };
      if (s1 < 2 || s2 < 8) return { ok: false, msg: 'Taking more off went past the empty outer shell, into a full inner shell, which puts out its lamp. Stop when the outer shell is empty.' };
      return { ok: true };
    },
    reward: {
      log: 'Magnesium outer shell gone at plus two.',
      title: 'Cations and Full Shells',
      body: 'Magnesium has two valence electrons. When it loses both, its remaining outermost shell has a full octet of eight, lighting the full-shell lamp at a +2 charge. Removing a third electron requires breaking into a full inner shell.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Fill It Past Neutral',
    prompt: 'Fill the outer shell of Sample A completely.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        nucleus('nuc', 'SAMPLE A', 14, 12, 17, 18),
        ...electrons('e', 2, 'tray:sh1'),
        ...electrons('e', 8, 'tray:sh2', 3),
        ...electrons('e', 7, 'tray:sh3', 11),
        ...electrons('e', 3, 'tray:src', 18)
      ],
      zones: { trays: [SOURCE_TRAY('Spare electrons', 3), ...SHELLS] },
      fixtures: [needleFixture(['tray:sh1', 'tray:sh2', 'tray:sh3'], 'nuc', { x: 50, y: 13 }, 4)]
    }),
    hints: [
      'Drag a spare electron onto a shell and watch the needle.',
      'Each tray prints how many electrons it holds against how many it can hold, and an atom can take on more electrons than it has protons.',
      'Add electrons one at a time and stop when the outermost shell is full, whatever the needle says.'
    ],
    check(state) {
      const [s1, s2, s3] = shells(state.table);
      if (s3 > 8 || s2 > 8 || s1 > 2) return { ok: false, msg: 'Too many on a shell. The closest shell holds 2 and each shell after it holds 8.' };
      const untouched = s3 === 7 && count(state.table, 'tray:src', 'electron') === 3;
      if (s3 < 8) return { ok: false, notYet: untouched, msg: 'The outer shell still has room, and a needle on zero does not make it full. Keep going until it is full, whatever the needle says.' };
      if (s1 < 2 || s2 < 8) return { ok: false, msg: 'Fill each shell before starting the next one: 2, then 8.' };
      return { ok: true };
    },
    reward: {
      log: 'Sample A loaded 2 / 8 / 8. Needle on minus one.',
      title: 'Anions',
      body: 'An atom carrying a negative charge is called an anion. This one holds 18 electrons against 17 protons, because filling the outer shell matters more than balancing the needle. Nonmetals sit one or two electrons short of full, so they take rather than give, and what you built is a chloride ion.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Cancel The Charges',
    prompt: 'Put the fewest Sample A and Sample B ions on the pad that balance it to zero charge.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        ...[10, 20, 30].map((x, i) => ({ id: `a${i + 1}`, kind: 'ion', label: 'SAMPLE A', at: { x, y: 11 }, props: { el: 'Mg', charge: 2 } })),
        ...[56, 66, 76, 86, 96, 106].map((x, i) => ({ id: `b${i + 1}`, kind: 'ion', label: 'SAMPLE B', at: { x, y: 11 }, props: { el: 'Cl', charge: -1 } }))
      ],
      zones: { trays: [trayAt('pad', 'Pad', 88, 35, 50, 22)] },
      fixtures: [{ id: 'needle', kind: 'needle', label: 'Pad charge', at: { x: 30, y: 34 }, size: { w: 44, h: 18 }, noRun: true, props: { zones: ['tray:pad'], range: 4 } }]
    }),
    hints: [
      'Read the charge printed on each ion, then drag ions onto the pad and watch its needle.',
      'Every ion of Sample A adds its charge and every ion of Sample B adds its charge, and the pad needle shows the running total.',
      'Keep adding ions until the needle reads zero, using the fewest you can.'
    ],
    check(state) {
      const t = state.table;
      const s = piecesIn(t, 'tray:pad').filter(p => p.props.el === 'Mg').length;
      const u = piecesIn(t, 'tray:pad').filter(p => p.props.el === 'Cl').length;
      if (s === 0 && u === 0) return { ok: false, notYet: true, msg: 'The pad is still empty. Drag ions onto it.' };
      if (s === 0 || u === 0) return { ok: false, msg: 'One sort of ion on its own cannot reach zero. Both positive and negative ions are needed.' };
      const net = needleReading(t, 'needle');
      if (net !== 0) return { ok: false, msg: `The pad reads ${net > 0 ? '+' : '-'}${Math.abs(net)}. Add ions until the total charge balances to zero.` };
      if (s !== 1 || u !== 2) return { ok: false, msg: 'That combination balances to zero, but it can be reduced. Divide both counts by a common factor to find the simplest ratio.' };
      return { ok: true };
    },
    reward: {
      log: 'One Sample A to two Sample B. Charge zero.',
      title: 'Charges Cancel In Whole Numbers',
      body: 'A neutral combination has to come out to zero charge, and you cannot use half an atom. So one atom at plus two needs two atoms at minus one. That ratio is why magnesium and chlorine combine one to two and never any other way.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'File Them All',
    prompt: 'Tray each sample by how it differs from reference Sample A.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        { ...specimen('std', 'SAMPLE A', 11, 12, { p: 8, n: 8, rings: [2, 6], counts: true, needle: true }), fixed: true },
        specimen('n1', 'SAMPLE B', 34, 12, { p: 8, n: 10, rings: [2, 6], counts: true, needle: true }),
        specimen('n2', 'SAMPLE C', 57, 12, { p: 8, n: 8, rings: [2, 8], counts: true, needle: true }),
        specimen('n3', 'SAMPLE D', 80, 12, { p: 7, n: 9, rings: [2, 5], counts: true, needle: true }),
        specimen('n4', 'SAMPLE E', 103, 12, { p: 8, n: 8, rings: [2, 6], counts: true, needle: true })
      ],
      zones: {
        trays: [
          specimenTray('match', 'No difference', 17, 37, 27),
          specimenTray('heavy', 'Extra neutrons', 46, 37, 27),
          specimenTray('charged', 'Carrying a charge', 75, 37, 27),
          specimenTray('other', 'Different element', 104, 37, 27)
        ]
      }
    }),
    hints: [
      'Read the printed counts on reference Sample A and on each sample.',
      'Compare each sample with the reference one count at a time: protons, then neutrons, then the needle.',
      'A different proton count is a different element, the same protons with more neutrons is extra neutrons, and the same counts with the needle off zero is a charge.'
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
          return { ok: false, msg: id === 'n3'
            ? 'Sample D is filed wrong. Check its protons against the reference before anything else.'
            : `${labels[id]} is filed wrong. Compare its protons, its neutrons and its needle with the reference, one at a time.` };
        }
      }
      return { ok: true };
    },
    reward: {
      log: 'All four filed.',
      title: 'Three Numbers Describe Any Atom',
      body: 'Atomic number says what the atom is, mass number says how heavy this one is, and net charge says what it is carrying. Each of the three can change without touching the other two. Get all three and you have described the atom completely.',
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
    },
    {
      heading: 'Next',
      body: 'Great work balancing the ledger! Next up, we\'ll discover why atomic masses on the periodic table aren\'t neat whole numbers.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'An atom has 15 protons, 16 neutrons and 15 electrons. What is its mass number?',
    options: [
      { id: 'a', label: '15' },
      { id: 'b', label: '16' },
      { id: 'c', label: '31' },
      { id: 'd', label: '46' }
    ],
    answer: 'c',
    explanation: 'Mass number is protons plus neutrons: 15 + 16 = 31. Electrons weigh too little to count.'
  },
  {
    question: 'Chlorine-37 has an atomic number of 17. How many neutrons does it have?',
    options: [
      { id: 'a', label: '17' },
      { id: 'b', label: '20' },
      { id: 'c', label: '37' },
      { id: 'd', label: '54' }
    ],
    answer: 'b',
    explanation: 'The number after the name is the mass number. Take the atomic number off it: 37 - 17 = 20 neutrons.'
  },
  {
    question: 'Chlorine-35 and chlorine-37 go into the same reaction. What happens?',
    options: [
      { id: 'a', label: 'They react in exactly the same way' },
      { id: 'b', label: 'Chlorine-37 reacts faster because it is heavier' },
      { id: 'c', label: 'Only chlorine-35 reacts at all' },
      { id: 'd', label: 'They react as two different elements' }
    ],
    answer: 'a',
    explanation: 'Isotopes differ only in neutrons, and reactions are done by electrons. Same protons means same electrons, so they behave the same.'
  },
  {
    question: 'A magnesium atom with 12 protons loses 2 electrons. What has it become?',
    options: [
      { id: 'a', label: 'A different element with 10 protons' },
      { id: 'b', label: 'An anion with a charge of -2' },
      { id: 'c', label: 'A cation with a charge of +2' },
      { id: 'd', label: 'An isotope of magnesium' }
    ],
    answer: 'c',
    explanation: 'Losing electrons leaves protons uncancelled, so the charge goes positive. The nucleus was never touched, so it is still magnesium.'
  },
  {
    question: 'An ion has a charge of +3 and 10 electrons. How many protons does it have?',
    options: [
      { id: 'a', label: '7' },
      { id: 'b', label: '10' },
      { id: 'c', label: '13' },
      { id: 'd', label: '30' }
    ],
    answer: 'c',
    explanation: 'Charge is protons minus electrons, so protons = 3 + 10 = 13. That is aluminium.'
  }
];


/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const to = (piece, target) => ({ place: { piece, to: target } });
const moveAll = (ids, zone) => ids.map(id => to(id, zone));
const ids = (prefix, from, upto) => Array.from({ length: upto - from + 1 }, (_, i) => `${prefix}${from + i}`);

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [{ fetch: 'cooler' }, ...moveAll(ids('p', 1, 3), 'tray:core'), ...moveAll(ids('n', 1, 4), 'tray:core'), ...moveAll(ids('e', 1, 3), 'tray:out')],
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
