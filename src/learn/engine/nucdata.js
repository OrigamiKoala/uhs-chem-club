/**
 * nucdata.js — the data and pure planners behind Cinder Halo (unit14, nuclear chemistry). No DOM, no THREE.
 *
 * Every number a Cinder Halo bench prints comes from here, and `tools/lib/cinderhalo/data-checks.mjs` holds these tables to values typed
 * in from their sources (never to the code below):
 *
 *   ELEMENTS        symbol and name by atomic number, 1 to 95
 *   STABLE          the stable nuclides (no observed decay) for Z 1 to 83, as mass numbers; bismuth-209 (half-life 2 × 10¹⁹ years) counts
 *                   as stable here, and the Tour says so. Source: the table of stable isotopes (CRC Handbook; NNDC NuDat "stable").
 *   NUCLIDES        the nuclides the benches name: half-life, decay mode, mass (NUBASE2020, AME2020; carbon-14 at the conventional 5,730 y)
 *   MASS            particle and nucleus masses in u (CODATA 2018, AME2020)
 *   BE_PER_NUCLEON  binding energy per nucleon, MeV (AME2020), printed to one decimal
 *   SOURCES         the counter's samples: what each gives off and how many of each reach the tube in a minute with nothing between
 *   PASS            the fraction of each radiation that gets through each shield (alpha and beta from their ranges; gamma from NIST XCOM)
 *
 * SIMPLIFICATIONS, each said on the bench: counts carry a fixed, seeded scatter of about 1 % (real counting scatters) that never depends on
 * temperature, chemistry or anything a student sets; the decaying grid follows the large-sample law exactly; the neutrino that leaves with a
 * beta particle or a positron is named once and not drawn.
 */

/* ------------------------------------------------------------------ elements */

const SYMS = 'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am'.split(' ');
const NAMES = ('hydrogen helium lithium beryllium boron carbon nitrogen oxygen fluorine neon sodium magnesium aluminium silicon phosphorus sulfur ' +
  'chlorine argon potassium calcium scandium titanium vanadium chromium manganese iron cobalt nickel copper zinc gallium germanium arsenic ' +
  'selenium bromine krypton rubidium strontium yttrium zirconium niobium molybdenum technetium ruthenium rhodium palladium silver cadmium ' +
  'indium tin antimony tellurium iodine xenon caesium barium lanthanum cerium praseodymium neodymium promethium samarium europium gadolinium ' +
  'terbium dysprosium holmium erbium thulium ytterbium lutetium hafnium tantalum tungsten rhenium osmium iridium platinum gold mercury ' +
  'thallium lead bismuth polonium astatine radon francium radium actinium thorium protactinium uranium neptunium plutonium americium').split(' ');

export const ELEMENTS = Object.freeze(SYMS.map((sym, i) => Object.freeze({ Z: i + 1, sym, name: NAMES[i] })));
export const symbolOf = Z => (Z >= 1 && Z <= ELEMENTS.length ? ELEMENTS[Z - 1].sym : Z === 0 ? 'n' : '?');
export const nameOf = Z => (Z >= 1 && Z <= ELEMENTS.length ? ELEMENTS[Z - 1].name : '?');
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
/** "uranium-238", "Uranium-238". */
export const nuclideName = (Z, A, { capital = false } = {}) => `${capital ? cap(nameOf(Z)) : nameOf(Z)}-${A}`;

/* ------------------------------------------------------------------ stable nuclides */

/** Mass numbers of the stable nuclides of each element, Z 1 to 83 (technetium, 43, and promethium, 61, have none). */
export const STABLE = Object.freeze({
  1: [1, 2], 2: [3, 4], 3: [6, 7], 4: [9], 5: [10, 11], 6: [12, 13], 7: [14, 15], 8: [16, 17, 18], 9: [19], 10: [20, 21, 22],
  11: [23], 12: [24, 25, 26], 13: [27], 14: [28, 29, 30], 15: [31], 16: [32, 33, 34, 36], 17: [35, 37], 18: [36, 38, 40], 19: [39, 41], 20: [40, 42, 43, 44, 46],
  21: [45], 22: [46, 47, 48, 49, 50], 23: [51], 24: [50, 52, 53, 54], 25: [55], 26: [54, 56, 57, 58], 27: [59], 28: [58, 60, 61, 62, 64], 29: [63, 65], 30: [64, 66, 67, 68, 70],
  31: [69, 71], 32: [70, 72, 73, 74], 33: [75], 34: [74, 76, 77, 78, 80], 35: [79, 81], 36: [80, 82, 83, 84, 86], 37: [85], 38: [84, 86, 87, 88], 39: [89], 40: [90, 91, 92, 94],
  41: [93], 42: [92, 94, 95, 96, 97, 98], 43: [], 44: [96, 98, 99, 100, 101, 102, 104], 45: [103], 46: [102, 104, 105, 106, 108, 110], 47: [107, 109], 48: [106, 108, 110, 111, 112, 114],
  49: [113], 50: [112, 114, 115, 116, 117, 118, 119, 120, 122, 124], 51: [121, 123], 52: [120, 122, 123, 124, 125, 126], 53: [127], 54: [126, 128, 129, 130, 131, 132, 134],
  55: [133], 56: [132, 134, 135, 136, 137, 138], 57: [139], 58: [136, 138, 140, 142], 59: [141], 60: [142, 143, 145, 146, 148], 61: [], 62: [144, 149, 150, 152, 154],
  63: [153], 64: [154, 155, 156, 157, 158, 160], 65: [159], 66: [156, 158, 160, 161, 162, 163, 164], 67: [165], 68: [162, 164, 166, 167, 168, 170], 69: [169],
  70: [168, 170, 171, 172, 173, 174, 176], 71: [175], 72: [176, 177, 178, 179, 180], 73: [181], 74: [182, 183, 184, 186], 75: [185], 76: [184, 187, 188, 189, 190, 192],
  77: [191, 193], 78: [192, 194, 195, 196, 198], 79: [197], 80: [196, 198, 199, 200, 201, 202, 204], 81: [203, 205], 82: [204, 206, 207, 208], 83: [209]
});
/** Is the nucleus of Z protons and N neutrons stable? */
export const stable = (Z, N) => Boolean(STABLE[Z] && STABLE[Z].includes(Z + N));
/** The stable mass numbers of an element (empty past 83). */
export const stableOf = Z => STABLE[Z] || [];

/* ------------------------------------------------------------------ decays */

/** Each kind of decay as a change of atomic number and mass number, and as a step on the chart (protons across, neutrons up). */
export const DECAY = Object.freeze({
  alpha: Object.freeze({ dZ: -2, dA: -4, particle: { A: 4, Z: 2, sym: 'He' }, name: 'alpha decay' }),
  beta: Object.freeze({ dZ: 1, dA: 0, particle: { A: 0, Z: -1, sym: 'e' }, name: 'beta decay' }),
  positron: Object.freeze({ dZ: -1, dA: 0, particle: { A: 0, Z: 1, sym: 'e' }, name: 'positron emission' }),
  capture: Object.freeze({ dZ: -1, dA: 0, particle: null, name: 'electron capture' }),
  gamma: Object.freeze({ dZ: 0, dA: 0, particle: { A: 0, Z: 0, sym: 'γ' }, name: 'gamma emission' })
});
/** The nucleus left after a decay. */
export function decayOf(Z, A, mode) {
  const d = DECAY[mode];
  if (!d) throw new Error(`no decay "${mode}"`);
  return { Z: Z + d.dZ, A: A + d.dA };
}
/** A decay as a step on the chart: protons across (dZ), neutrons up (dN). */
export function stepOf(mode) {
  const d = DECAY[mode];
  return { dZ: d.dZ, dN: d.dA - d.dZ };
}

/* ------------------------------------------------------------------ nuclides the benches name */

const Y = 365.25; // days in a year
/** Half-life in days, the decay the bench shows, and (where a bench weighs it) the atomic mass in u. */
export const NUCLIDES = Object.freeze({
  'U-238': { Z: 92, A: 238, half: 4.468e9 * Y, mode: 'alpha', mass: 238.050788 },
  'U-235': { Z: 92, A: 235, half: 7.04e8 * Y, mode: 'alpha', mass: 235.043930 },
  'Th-234': { Z: 90, A: 234, half: 24.1, mode: 'beta' },
  'Th-232': { Z: 90, A: 232, half: 1.40e10 * Y, mode: 'alpha' },
  'F-18': { Z: 9, A: 18, half: 109.8 / 1440, mode: 'positron' },
  'Be-7': { Z: 4, A: 7, half: 53.2, mode: 'capture' },
  'Tc-99m': { Z: 43, A: 99, half: 6.01 / 24, mode: 'gamma', meta: true },
  'C-14': { Z: 6, A: 14, half: 5730 * Y, mode: 'beta' },
  'O-15': { Z: 8, A: 15, half: 122.2 / 86400, mode: 'positron' },
  'Po-210': { Z: 84, A: 210, half: 138.4, mode: 'alpha' },
  'Co-60': { Z: 27, A: 60, half: 5.27 * Y, mode: 'beta' },
  'I-131': { Z: 53, A: 131, half: 8.02, mode: 'beta' },
  'Na-24': { Z: 11, A: 24, half: 14.96 / 24, mode: 'beta' },
  'Sr-90': { Z: 38, A: 90, half: 28.8 * Y, mode: 'beta' },
  'Am-241': { Z: 95, A: 241, half: 432.2 * Y, mode: 'alpha' },
  'Pb-206': { Z: 82, A: 206, half: Infinity, mode: null },
  'Pb-208': { Z: 82, A: 208, half: Infinity, mode: null },
  'Pb-207': { Z: 82, A: 207, half: Infinity, mode: null },
  'Ba-141': { Z: 56, A: 141, half: 18.27 / 1440, mode: 'beta', mass: 140.914403 },
  'Kr-92': { Z: 36, A: 92, half: 1.84 / 86400, mode: 'beta', mass: 91.926173 },
  'Fe-56': { Z: 26, A: 56, half: Infinity, mode: null, mass: 55.934936 },
  'Au-197': { Z: 79, A: 197, half: Infinity, mode: null }
});

/* ------------------------------------------------------------------ masses and energy */

/** Masses in u. `p`, `n`, `e` particles; `He4n` and `H2n` are NUCLEI (no electrons); the rest atomic. */
export const MASS = Object.freeze({ p: 1.007276, n: 1.008665, e: 0.000549, H1: 1.007825, He4n: 4.001506, H2n: 2.013553 });
/** 1 u of mass as energy: 931.494 MeV (printed 931.5). */
export const MEV_PER_U = 931.494;
export const MEV_PER_U_PRINTED = 931.5;
/** Mass of a list of parts: `{ p: 2, n: 2 }` or `[['He4n', 1]]`. */
export function massOf(parts) {
  let m = 0;
  for (const [k, c] of Object.entries(parts)) {
    const one = MASS[k] ?? NUCLIDES[k]?.mass;
    if (one == null) throw new Error(`no mass for "${k}"`);
    m += one * c;
  }
  return m;
}
/** The loads the benches weigh, by name. */
export const LOADS = Object.freeze({
  'He4-parts': { p: 2, n: 2 },
  'He4': { He4n: 1 },
  'H2-parts': { p: 1, n: 1 },
  'H2': { H2n: 1 },
  'H2-pair': { H2n: 2 },
  'U235-fuel': { 'U-235': 1, n: 1 },
  'U235-split': { 'Ba-141': 1, 'Kr-92': 1, n: 3 }
});
/** Mass defect (u) of one load against another, and its energy (MeV). */
export function defect(before, after) {
  const dm = massOf(LOADS[before] || before) - massOf(LOADS[after] || after);
  return { dm, mev: dm * MEV_PER_U };
}

/** Binding energy per nucleon, MeV (AME2020, rounded to three decimals). */
export const BE_PER_NUCLEON = Object.freeze([
  ['H-2', 2, 1.112], ['H-3', 3, 2.827], ['He-3', 3, 2.573], ['He-4', 4, 7.074], ['Li-6', 6, 5.332], ['Li-7', 7, 5.606], ['Be-9', 9, 6.463],
  ['B-11', 11, 6.928], ['C-12', 12, 7.680], ['N-14', 14, 7.476], ['O-16', 16, 7.976], ['Ne-20', 20, 8.032], ['Mg-24', 24, 8.261],
  ['Si-28', 28, 8.448], ['S-32', 32, 8.493], ['Ca-40', 40, 8.551], ['Fe-56', 56, 8.790], ['Ni-62', 62, 8.795], ['Zn-64', 64, 8.736],
  ['Kr-84', 84, 8.717], ['Kr-92', 92, 8.513], ['Zr-90', 90, 8.710], ['Sn-120', 120, 8.505], ['Ba-141', 141, 8.326], ['Gd-158', 158, 8.202],
  ['W-184', 184, 8.005], ['Au-197', 197, 7.916], ['Pb-208', 208, 7.868], ['U-235', 235, 7.591], ['U-238', 238, 7.570]
].map(([name, A, be]) => Object.freeze({ name, A, be })));
export const bePerNucleon = name => BE_PER_NUCLEON.find(r => r.name === name)?.be ?? null;
/** "Iron-56" from "Fe-56". */
export function longName(name) {
  const [sym, A] = name.split('-');
  const e = ELEMENTS.find(x => x.sym === sym);
  return e ? `${cap(e.name)}-${A}` : name;
}

/** Generations of a chain reaction: `freed` neutrons per fission, `absorbed` of them soaked up, `n` generations. */
export function generations(absorbed, n = 4, freed = 3) {
  const per = Math.max(0, freed - absorbed);
  const out = [1];
  for (let i = 1; i < n; i++) out.push(out[i - 1] * per);
  return out;
}

/* ------------------------------------------------------------------ counting */

/** The fraction of each radiation that gets through each shield. `open` is nothing between. */
export const PASS = Object.freeze({
  alpha: { open: 1, paper: 0, aluminium: 0, lead: 0 },
  betaHi: { open: 1, paper: 0.97, aluminium: 0.004, lead: 0 },     // strontium-90 with yttrium-90 (to 2.28 MeV)
  betaLo: { open: 1, paper: 0.9, aluminium: 0, lead: 0 },          // cobalt-60's own beta (to 0.32 MeV)
  gammaHi: { open: 1, paper: 1, aluminium: 0.93, lead: 0.05 },     // cobalt-60's 1.17 and 1.33 MeV
  gammaLo: { open: 1, paper: 1, aluminium: 0.69, lead: 0 },        // americium-241's 59.5 keV
  gammaOre: { open: 1, paper: 1, aluminium: 0.9, lead: 0.1 }       // the uranium series' mixed gammas
});
/** What kind of track each line of `PASS` is. */
export const KIND_OF = Object.freeze({ alpha: 'alpha', betaHi: 'beta', betaLo: 'beta', gammaHi: 'gamma', gammaLo: 'gamma', gammaOre: 'gamma' });
export const SHIELDS = Object.freeze({
  paper: { name: 'Paper', thick: '0.1 mm' },
  aluminium: { name: 'Aluminium', thick: '5 mm' },
  lead: { name: 'Lead', thick: '5 cm' }
});

/** The counter's samples: counts reaching the tube in a minute, open, per gram where `perGram`. `nuclide` is what it is (not printed). */
export const SOURCES = Object.freeze({
  oreU: { name: 'Uranium ore', nuclide: 'U-238', lines: { alpha: 1200, betaHi: 500, gammaOre: 140 }, perGram: true },
  oreFe: { name: 'Iron ore', nuclide: null, lines: {}, perGram: true },
  po210: { name: 'Polonium-210', nuclide: 'Po-210', lines: { alpha: 2400 } },
  po210b: { name: 'Polonium-210', nuclide: 'Po-210', lines: { alpha: 1500 } },
  sr90: { name: 'Strontium-90', nuclide: 'Sr-90', lines: { betaHi: 2950 } },
  co60s: { name: 'Cobalt-60, sealed', nuclide: 'Co-60', lines: { gammaHi: 880 } },
  am241: { name: 'Americium-241', nuclide: 'Am-241', lines: { alpha: 1700, gammaLo: 280 } },
  co60: { name: 'Cobalt-60', nuclide: 'Co-60', lines: { betaLo: 2300, gammaHi: 880 } }
});
export const BACKGROUND = 24;
export const BACKGROUND_HOUSED = 4;

/** A deterministic number in [-1, 1) from a string: the counter's scatter. */
export function scatter(key) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return ((h >>> 0) / 4294967296) * 2 - 1;
}

/**
 * Counts in one minute. `src` a SOURCES key (or null for an empty slot); `shield` a PASS column; `grams` for ores; `housed` closes lead
 * round the tube (background only); `run` is the count's number on this rig (the scatter's seed). Temperature is taken and ignored on
 * purpose: the bench lets a student set it, and the nucleus does not feel it.
 */
export function countsOf(src, { shield = 'open', grams = 1, housed = false, run = 0, temp = 20 } = {}) {
  void temp;
  const S = src ? SOURCES[src] : null;
  let rate = 0;
  if (S) for (const [line, r] of Object.entries(S.lines)) rate += r * (S.perGram ? grams : 1) * PASS[line][shield];
  const bg = housed ? BACKGROUND_HOUSED : BACKGROUND;
  const spread = 0.008 * rate + 1.5;
  return Math.max(0, Math.round(rate + bg + scatter(`${src}|${shield}|${grams}|${housed}|${run}`) * spread));
}
/** Which kinds of track a source gives off (for drawing), with how many of each reach a given shield. */
export function tracksOf(src, shield = 'open') {
  const S = SOURCES[src];
  if (!S) return [];
  return Object.entries(S.lines).map(([line, r]) => ({ line, kind: KIND_OF[line], rate: r, pass: PASS[line][shield] }));
}

/* ------------------------------------------------------------------ the decaying sample */

/** Nuclei left of `N0` after `t`, by the large-sample law, rounded to whole nuclei. */
export const leftAt = (N0, t, half) => Math.round(N0 * Math.pow(2, -t / half));
/**
 * The moment each of `N0` nuclei decays, spread so that a count at any time follows the large-sample law: the k-th to go goes at the time
 * the law leaves N0 − k − 0.5. The order across the grid is shuffled by a seeded generator so the decays look scattered.
 */
export function decayTimes(N0, half, seed = 7) {
  const times = Array.from({ length: N0 }, (_, k) => -half * Math.log2((N0 - k - 0.5) / N0));
  let s = seed >>> 0;
  const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  for (let i = N0 - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [times[i], times[j]] = [times[j], times[i]]; }
  return times;
}
/** Nuclei of a grid still there at `t` (the same count the law gives, from the grid's own decay moments). */
export const gridLeft = (times, t) => times.filter(x => x > t + 1e-9).length;
/** A first-order rate constant from a half-life: k = 0.693 / t½. */
export const rateConstant = half => 0.693 / half;

/** Carbon-14 counts per minute per gram of carbon in living matter (the bench's figure). */
export const C14_LIVING = 15.3;
