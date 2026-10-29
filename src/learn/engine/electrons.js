/**
 * electrons.js — Where the electrons are, as the box rack and the photoelectron
 * spectrum read them.
 *
 * PURE, NODE-IMPORTABLE, NO DOM. Everything the box rack (`boxrack.js`) and the
 * core bench's spectrum field report is computed here from a few real tables, and
 * `verify:learn` imports it to hold every stage to them: the ground-state
 * configurations, the measured number of unpaired electrons that the magnet
 * finds, the binding energies of a photoelectron spectrum, the ionization
 * energies, radii and electronegativities that Lanternfall's trends bench reads.
 *
 * THE RULES THE BENCH ENFORCES ARE REAL AND NOT TAUGHT BY HINT:
 *   - a box holds at most one electron pointing up and one pointing down
 *     (Pauli), so a second "up" in a box is refused;
 *   - the unpaired count of an arrangement is read off the boxes themselves;
 *   - what the MAGNET measures is a property of the REAL sample (`MEASURED`),
 *     never of the player's arrangement, because that is what makes a stage
 *     like chromium's a discovery: the rule says 4, the magnet says 6.
 */

/* ------------------------------------------------------------------
   THE ELEMENTS
   ------------------------------------------------------------------ */

const SYMBOLS = [
  '', 'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne',
  'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca',
  'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn',
  'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr', 'Rb', 'Sr', 'Y', 'Zr',
  'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn',
  'Sb', 'Te', 'I', 'Xe', 'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd',
  'Pm', 'Sm', 'Eu'
];

const NAMES = {
  H: 'hydrogen', He: 'helium', Li: 'lithium', Be: 'beryllium', B: 'boron', C: 'carbon', N: 'nitrogen',
  O: 'oxygen', F: 'fluorine', Ne: 'neon', Na: 'sodium', Mg: 'magnesium', Al: 'aluminum', Si: 'silicon',
  P: 'phosphorus', S: 'sulfur', Cl: 'chlorine', Ar: 'argon', K: 'potassium', Ca: 'calcium', Sc: 'scandium',
  Ti: 'titanium', V: 'vanadium', Cr: 'chromium', Mn: 'manganese', Fe: 'iron', Co: 'cobalt', Ni: 'nickel',
  Cu: 'copper', Zn: 'zinc', Ga: 'gallium', Ge: 'germanium', As: 'arsenic', Se: 'selenium', Br: 'bromine',
  Kr: 'krypton', Ba: 'barium', Eu: 'europium'
};

export function symbolOf(z) { return SYMBOLS[z] || null; }
export function zOf(sym) { return SYMBOLS.indexOf(sym); }
export function nameOf(sym) { return NAMES[sym] || sym.toLowerCase(); }

/** The catalogue code a Tallow bench filed an element under. It is the atomic number. */
export function codeOf(sym) {
  const z = zOf(sym);
  return z > 0 ? `CAT ${String(z).padStart(2, '0')}` : null;
}

/* ------------------------------------------------------------------
   THE LADDER
   ------------------------------------------------------------------ */

/**
 * Every subshell, lowest energy first: the order an atom's electrons fill them
 * in. The 4s row sits BELOW the 3d row, which is the single fact a quest on
 * potassium turns on.
 */
export const LADDER = [
  { id: '1s', n: 1, l: 0 },
  { id: '2s', n: 2, l: 0 },
  { id: '2p', n: 2, l: 1 },
  { id: '3s', n: 3, l: 0 },
  { id: '3p', n: 3, l: 1 },
  { id: '4s', n: 4, l: 0 },
  { id: '3d', n: 3, l: 2 },
  { id: '4p', n: 4, l: 1 },
  { id: '5s', n: 5, l: 0 },
  { id: '4d', n: 4, l: 2 },
  { id: '5p', n: 5, l: 1 },
  { id: '6s', n: 6, l: 0 },
  { id: '4f', n: 4, l: 3 },
  { id: '5d', n: 5, l: 2 },
  { id: '6p', n: 6, l: 1 }
];

const LETTER = ['s', 'p', 'd', 'f'];

/** How many boxes a row of angular momentum l has. */
export function boxesOf(l) { return 2 * l + 1; }

/** How many electrons a row holds. */
export function capacityOf(rowId) {
  const row = LADDER.find(r => r.id === rowId);
  return 2 * boxesOf(row.l);
}

export function rowOf(rowId) { return LADDER.find(r => r.id === rowId) || null; }

/** The noble gas cores, as the last row each one fills. */
export const NOBLE_CORES = [
  { sym: 'He', through: '1s' },
  { sym: 'Ne', through: '2p' },
  { sym: 'Ar', through: '3p' },
  { sym: 'Kr', through: '4p' },
  { sym: 'Xe', through: '5p' }
];

/**
 * The ground-state configuration of element `z`: electrons per row. The ladder
 * is filled from the bottom, and the two measured exceptions the course teaches
 * (chromium and copper, each trading a 4s electron for a half- or full 3d row)
 * are written down as the measurements they are.
 */
export function groundConfig(z) {
  const out = {};
  let left = z;
  for (const row of LADDER) {
    if (left <= 0) break;
    const take = Math.min(left, capacityOf(row.id));
    out[row.id] = take;
    left -= take;
  }
  if (z === 24) { out['4s'] = 1; out['3d'] = 5; }
  if (z === 29) { out['4s'] = 1; out['3d'] = 10; }
  return out;
}

/** Superscript digits for a written configuration. */
const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export function sup(n) { return String(n).split('').map(c => SUP[c]).join(''); }

/**
 * The configuration as the rack writes it: rows in ladder order, lowest first,
 * each as its label and the number of electrons in it. A row with nothing in it
 * is left out.
 */
export function configString(counts, opts = {}) {
  const parts = [];
  for (const row of LADDER) {
    const n = counts[row.id] || 0;
    if (n) parts.push(`${row.id}${opts.plain ? n : sup(n)}`);
  }
  return parts.join(' ');
}

/** The noble gas whose core a configuration contains, or null. */
export function coreOf(counts) {
  let found = null;
  for (const core of NOBLE_CORES) {
    let full = true;
    for (const row of LADDER) {
      const n = counts[row.id] || 0;
      if (n !== capacityOf(row.id)) { full = false; break; }
      if (row.id === core.through) break;
    }
    if (full) found = core;
  }
  return found;
}

/** The short form: the noble gas core in brackets, then every row beyond it. */
export function shortString(counts, opts = {}) {
  const core = coreOf(counts);
  if (!core) return configString(counts, opts);
  const rest = { ...counts };
  for (const row of LADDER) {
    rest[row.id] = 0;
    if (row.id === core.through) break;
  }
  const tail = configString(rest, opts);
  return tail ? `[${core.sym}] ${tail}` : `[${core.sym}]`;
}

/** The block of the periodic table an element sits in: where its last electron went. */
export function blockOf(z) {
  const counts = groundConfig(z);
  let last = null;
  for (const row of LADDER) if (counts[row.id]) last = row;
  return last ? LETTER[last.l] : null;
}

/**
 * The most electrons that can sit unpaired in `e` electrons spread over `b`
 * boxes: Hund's rule fills every box once before any is filled twice.
 */
export function maxUnpaired(e, b) { return e <= b ? e : Math.max(0, 2 * b - e); }

/** Unpaired electrons in a ground-state atom, the way the rule fills it. */
export function unpairedOfConfig(counts) {
  let n = 0;
  for (const row of LADDER) {
    const e = counts[row.id] || 0;
    if (e) n += maxUnpaired(e, boxesOf(row.l));
  }
  return n;
}

/**
 * WHAT THE MAGNET MEASURES. Real samples, real counts: the number of unpaired
 * electrons in each. It is a property of the sample and not of anything the
 * player has done, which is the whole point of a measurement. Chromium and
 * copper are the two cases where the rule and the measurement disagree.
 */
export const MEASURED = {
  H: 1, He: 0, Li: 1, Be: 0, B: 1, C: 2, N: 3, O: 2, F: 1, Ne: 0,
  Na: 1, Mg: 0, Al: 1, Si: 2, P: 3, S: 2, Cl: 1, Ar: 0, K: 1, Ca: 0,
  Sc: 1, Ti: 2, V: 3, Cr: 6, Mn: 5, Fe: 4, Co: 3, Ni: 2, Cu: 1, Zn: 0,
  // Ions, from the same measurement.
  'Fe2+': 4, 'Fe3+': 5, 'Mn2+': 5, 'Zn2+': 0, 'Ti2+': 2, 'Cu+': 0, 'Cu2+': 1
};

/* ------------------------------------------------------------------
   THE RACK: boxes, electrons and what they read
   ------------------------------------------------------------------ */

/**
 * A rack is a map of `"<row>:<box>"` to what is in the box: `"u"`, `"d"` or
 * `"ud"`. Boxes run left to right in order of m_l, from -l to +l.
 */
export function boxKey(rowId, idx) { return `${rowId}:${idx}`; }

/** The m_l a box carries: -l ... +l, left to right. */
export function mlOf(rowId, idx) { return idx - rowOf(rowId).l; }

/**
 * Put one electron in a box. Returns the new rack, or `{ refused }` with the
 * reason. A box already holding an electron of that spin refuses a second one:
 * the rack enforces the rule, it never lectures about it.
 */
export function placeElectron(rack, rowId, idx, spin) {
  const key = boxKey(rowId, idx);
  const here = rack[key] || '';
  if (here.includes(spin)) {
    return { refused: `This box already holds an electron pointing ${spin === 'u' ? 'up' : 'down'}.` };
  }
  const next = { ...rack };
  next[key] = (here + spin).split('').sort().reverse().join('');
  return { rack: next };
}

/** Take one electron out of a box, the one pointing `spin`, or the last one in. */
export function removeElectron(rack, rowId, idx, spin = null) {
  const key = boxKey(rowId, idx);
  const here = rack[key] || '';
  if (!here) return { refused: 'That box is empty.' };
  const take = spin && here.includes(spin) ? spin : here[here.length - 1];
  const left = here.replace(take, '');
  const next = { ...rack };
  if (left) next[key] = left; else delete next[key];
  return { rack: next };
}

/**
 * Everything the rack reads off an arrangement: electrons per row, the total, how
 * many stand alone in a box, whether every single electron points the same way
 * (the parallel arrangement), and whether any box is doubled while a box in its
 * own row is still empty (an arrangement the rule would not choose).
 */
export function readRack(rack) {
  const counts = {};
  let total = 0;
  let unpaired = 0;
  let doubledWhileEmpty = false;
  let mixedSingles = false;
  const singleSpins = new Set();
  let netUp = 0;

  for (const row of LADDER) {
    const boxes = boxesOf(row.l);
    let rowTotal = 0;
    let anyDouble = false;
    let anyEmpty = false;
    for (let i = 0; i < boxes; i++) {
      const here = rack[boxKey(row.id, i)] || '';
      rowTotal += here.length;
      if (here.length === 1) { unpaired++; singleSpins.add(here); netUp += here === 'u' ? 1 : -1; }
      if (here.length === 2) anyDouble = true;
      if (here.length === 0) anyEmpty = true;
    }
    if (rowTotal) counts[row.id] = rowTotal;
    total += rowTotal;
    if (anyDouble && anyEmpty) doubledWhileEmpty = true;
  }
  if (singleSpins.size > 1) mixedSingles = true;

  return {
    counts, total, unpaired,
    /** What a magnet finds in the arrangement: single electrons pointing the same way add, opposite ones cancel. */
    pull: Math.abs(netUp),
    config: configString(counts),
    short: shortString(counts),
    doubledWhileEmpty, mixedSingles,
    /** Every row has its lower rows filled first (the ladder's order). */
    laddered: isLaddered(counts),
    /** True when the arrangement is the one the rule would choose. */
    ruleHolds: !doubledWhileEmpty && !mixedSingles
  };
}

/** True when no row holds an electron while a lower row still has room. */
export function isLaddered(counts) {
  let open = false;
  for (const row of LADDER) {
    const n = counts[row.id] || 0;
    if (n > 0 && open) return false;
    if (n < capacityOf(row.id)) open = true;
  }
  return true;
}

/**
 * A rack that holds exactly the ground state of element `z`, filled the way the
 * rule fills it: every box once with an up arrow, then the second arrow down.
 */
export function rackFor(z, opts = {}) {
  const counts = opts.counts || groundConfig(z);
  const rack = {};
  for (const row of LADDER) {
    let e = counts[row.id] || 0;
    const boxes = boxesOf(row.l);
    for (let i = 0; i < boxes && e > 0; i++) { rack[boxKey(row.id, i)] = 'u'; e--; }
    for (let i = 0; i < boxes && e > 0; i++) { rack[boxKey(row.id, i)] = 'ud'; e--; }
  }
  return rack;
}

/** The four numbers that name the electron in a box: n, l, m_l and m_s (+1/2 up, -1/2 down). */
export function addressOf(rowId, idx, spin) {
  const row = rowOf(rowId);
  return { n: row.n, l: row.l, ml: mlOf(rowId, idx), ms: spin === 'u' ? 0.5 : -0.5 };
}

export function fmtMs(ms) { return ms > 0 ? '+1/2' : '-1/2'; }
export function fmtMl(ml) { return ml > 0 ? `+${ml}` : String(ml); }

/** Whether four numbers can name an electron at all. */
export function validAddress({ n, l, ml, ms }) {
  if (!Number.isInteger(n) || n < 1) return false;
  if (!Number.isInteger(l) || l < 0 || l >= n) return false;
  if (!Number.isInteger(ml) || Math.abs(ml) > l) return false;
  return ms === 0.5 || ms === -0.5;
}

/**
 * The box a floor, a suite type and a room name, or none. Only `n`, `l` and
 * `ml` matter: the bunk (`ms`) says which arrow in the box, never which box.
 * `idx` is the box's place along its row from the left, the way the rack lays
 * boxes out: ml runs from -l at the left to +l at the right.
 */
export function findRoom({ n, l, ml }) {
  const row = LADDER.find(r => r.n === n && r.l === l) || null;
  const exists = Number.isInteger(n) && n >= 1 && Number.isInteger(l) && l >= 0 && l < n
    && Number.isInteger(ml) && Math.abs(ml) <= l;
  return { exists, row: exists && row ? row.id : null, idx: exists ? ml + l : null };
}

/** Two electrons in one atom may not share all four numbers. */
export function sameAddress(a, b) {
  return a.n === b.n && a.l === b.l && a.ml === b.ml && a.ms === b.ms;
}

/** How many electrons a shell holds: 2 n squared. */
export function shellCapacity(n) { return 2 * n * n; }

/* ------------------------------------------------------------------
   THE PHOTOELECTRON SPECTRUM
   ------------------------------------------------------------------ */

/** Binding energies in MJ/mol per row, from the real spectra. */
export const BINDING = {
  H: { '1s': 1.31 },
  He: { '1s': 2.37 },
  Li: { '1s': 6.26, '2s': 0.52 },
  Be: { '1s': 11.5, '2s': 0.90 },
  B: { '1s': 19.3, '2s': 1.36, '2p': 0.80 },
  C: { '1s': 28.6, '2s': 1.72, '2p': 1.09 },
  N: { '1s': 39.6, '2s': 2.45, '2p': 1.40 },
  O: { '1s': 52.6, '2s': 3.12, '2p': 1.31 },
  F: { '1s': 67.2, '2s': 3.88, '2p': 1.68 },
  Ne: { '1s': 84.0, '2s': 4.68, '2p': 2.08 },
  Na: { '1s': 104, '2s': 6.84, '2p': 3.67, '3s': 0.50 },
  // Mg and Al continue the trend the tabulated elements follow, to the same
  // rounding; their outermost rows are the real first ionization energies.
  Mg: { '1s': 126, '2s': 8.9, '2p': 5.31, '3s': 0.74 },
  Al: { '1s': 151, '2s': 11.0, '2p': 7.0, '3s': 1.09, '3p': 0.58 }
};

/**
 * The spectrum of element `sym`: a peak per row that holds electrons, its
 * position the binding energy and its height the number of electrons in the
 * row. Ordered from the most tightly bound.
 */
export function planPES(sym) {
  const z = zOf(sym);
  const counts = groundConfig(z);
  const table = BINDING[sym];
  if (!table) return null;
  const peaks = [];
  for (const row of LADDER) {
    const n = counts[row.id] || 0;
    if (!n) continue;
    peaks.push({ row: row.id, height: n, energy: table[row.id] });
  }
  return peaks.sort((a, b) => b.energy - a.energy);
}

/* ------------------------------------------------------------------
   THE PULL ON AN ELECTRON
   ------------------------------------------------------------------ */

/** First ionization energies, kJ/mol. */
export const IONIZATION = {
  Li: 520, Be: 899, B: 801, C: 1086, N: 1402, O: 1314, F: 1681, Ne: 2081,
  Na: 496, Mg: 738, Al: 578, K: 419
};

/** Electron affinities, kJ/mol released when a gaseous neutral atom gains one electron (negative: energy has to be put in). */
export const ELECTRON_AFFINITY = { Li: 60, C: 122, N: -7, O: 141, F: 328, Na: 53, Cl: 349 };

/** Magnesium's successive ionization energies, kJ/mol. */
export const MG_SUCCESSIVE = [738, 1451, 7733];

/** Atomic radii, pm. */
export const RADIUS = { Li: 152, Be: 112, B: 85, C: 77, N: 75, O: 73, F: 72, Na: 186, Mg: 160, K: 227 };

/** Ionic radii, pm. */
export const ION_RADIUS = { 'Na+': 102, Na: 186, Cl: 99, 'Cl-': 181 };

/** Pauling electronegativity. */
export const ELECTRONEGATIVITY = { H: 2.20, C: 2.55, N: 3.04, O: 3.44, F: 3.98, Cl: 3.16, Na: 0.93, K: 0.82 };

/**
 * The charge an outer electron actually feels: the nuclear charge less the
 * electrons that stand between it and the core (every electron in a lower shell).
 * A simple count, and exactly the "Z minus core electrons" the bench teaches.
 */
export function zEff(z) {
  const counts = groundConfig(z);
  let outerN = 0;
  for (const row of LADDER) if (counts[row.id]) outerN = Math.max(outerN, row.n);
  let core = 0;
  for (const row of LADDER) if (counts[row.id] && row.n < outerN) core += counts[row.id];
  return { z, core, zeff: z - core, outerN };
}
