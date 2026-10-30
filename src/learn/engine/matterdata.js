/**
 * THE STATES-OF-MATTER TABLES — Mirrowen (Unit 6)
 *
 * Every figure on the probe, the vapour flask, the heating curve, the flask bench and the strip comes from the rows and functions
 * below. No stage types a reading. PURE: no DOM, no three, Node-importable, shared by the drawn and the built tables.
 *
 * SOURCES. Enthalpies of vaporization at the normal boiling point, boiling points, van der Waals radii: CRC Handbook of Chemistry and
 * Physics (enthalpy of vaporization table; Bondi 1964 radii). Antoine constants (mmHg, °C): NIST WebBook, the range that holds each
 * liquid at room temperature. Hydration enthalpies of gaseous ions: Marcus, "Ion Properties" (1997), rounded to 1 kJ/mol. Surface
 * tension and viscosity at 20 °C: CRC. Heat capacities, latent heats of water: CRC, 1 atm. Where a value is rounded the row says so.
 *
 * ONE ROW IS A SIMULATION, not a table: `CHROM` (paper chromatography spot travel) is a model of competition between the paper and the
 * solvent, tuned to behave like the real thing (a polar solvent carries a polar dye, a nonpolar solvent leaves it behind). The strip's
 * bench says so.
 */

/* ------------------------------------------------------------------
   MOLECULES, AND THE GRIP BETWEEN THEM
   ------------------------------------------------------------------ */

/**
 * `grip`: the molar enthalpy of vaporization at the normal boiling point, kJ/mol: the heat that pulls one mole of the liquid's molecules
 * away from their neighbours. `bp` the normal boiling point in °C. `M` the molar mass in g/mol. `force` the strongest kind of
 * intermolecular force the substance has. `r` the van der Waals radius of a noble-gas atom, pm. `atoms` the molecule's atoms with their
 * place in a unit-length frame for the glyph (x right, y up, bond length 1).
 */
export const SUBSTANCES = Object.freeze({
  He:   { id: 'He',   formula: 'He',       name: 'helium',          M: 4.003,   bp: -268.9, grip: 0.083, force: 'dispersion', r: 140, polar: false },
  Ne:   { id: 'Ne',   formula: 'Ne',       name: 'neon',            M: 20.18,   bp: -246.1, grip: 1.71,  force: 'dispersion', r: 154, polar: false },
  Ar:   { id: 'Ar',   formula: 'Ar',       name: 'argon',           M: 39.95,   bp: -185.8, grip: 6.43,  force: 'dispersion', r: 188, polar: false },
  Kr:   { id: 'Kr',   formula: 'Kr',       name: 'krypton',         M: 83.80,   bp: -153.4, grip: 9.08,  force: 'dispersion', r: 202, polar: false },
  Xe:   { id: 'Xe',   formula: 'Xe',       name: 'xenon',           M: 131.29,  bp: -108.1, grip: 12.57, force: 'dispersion', r: 216, polar: false },
  HCl:  { id: 'HCl',  formula: 'HCl',      name: 'hydrogen chloride', M: 36.46, bp: -85.1,  grip: 16.15, force: 'dipole',     polar: true },
  H2S:  { id: 'H2S',  formula: 'H₂S',      name: 'hydrogen sulfide', M: 34.08,  bp: -60.3,  grip: 18.67, force: 'dipole',     polar: true },
  PH3:  { id: 'PH3',  formula: 'PH₃',      name: 'phosphine',       M: 34.00,   bp: -87.7,  grip: 14.6,  force: 'dipole',     polar: true },
  H2O:  { id: 'H2O',  formula: 'H₂O',      name: 'water',           M: 18.015,  bp: 100,    grip: 40.65, force: 'hydrogen',   polar: true },
  NH3:  { id: 'NH3',  formula: 'NH₃',      name: 'ammonia',         M: 17.03,   bp: -33.3,  grip: 23.35, force: 'hydrogen',   polar: true },
  HF:   { id: 'HF',   formula: 'HF',       name: 'hydrogen fluoride', M: 20.01, bp: 19.5,   grip: 25.18, force: 'hydrogen',   polar: true },
  CH4:  { id: 'CH4',  formula: 'CH₄',      name: 'methane',         M: 16.04,   bp: -161.5, grip: 8.19,  force: 'dispersion', polar: false },
  C2H6: { id: 'C2H6', formula: 'C₂H₆',     name: 'ethane',          M: 30.07,   bp: -88.6,  grip: 14.7,  force: 'dispersion', polar: false },
  C3H8: { id: 'C3H8', formula: 'C₃H₈',     name: 'propane',         M: 44.10,   bp: -42.1,  grip: 18.8,  force: 'dispersion', polar: false },
  C4H10: { id: 'C4H10', formula: 'C₄H₁₀',  name: 'butane',          M: 58.12,   bp: -0.5,   grip: 22.4,  force: 'dispersion', polar: false },
  C5H12: { id: 'C5H12', formula: 'C₅H₁₂',  name: 'n-pentane',       M: 72.15,   bp: 36.1,   grip: 25.8,  force: 'dispersion', polar: false },
  neoC5: { id: 'neoC5', formula: 'C₅H₁₂',  name: 'neopentane',      M: 72.15,   bp: 9.5,    grip: 22.7,  force: 'dispersion', polar: false },
  acetone: { id: 'acetone', formula: 'C₃H₆O', name: 'acetone',      M: 58.08,   bp: 56.1,   grip: 29.1,  force: 'dipole',     polar: true },
  ethanol: { id: 'ethanol', formula: 'C₂H₅OH', name: 'ethanol',     M: 46.07,   bp: 78.4,   grip: 38.6,  force: 'hydrogen',   polar: true },
  ether: { id: 'ether', formula: 'C₄H₁₀O', name: 'diethyl ether',   M: 74.12,   bp: 34.6,   grip: 26.5,  force: 'dipole',     polar: true },
  hexane: { id: 'hexane', formula: 'C₆H₁₄', name: 'hexane',         M: 86.18,   bp: 68.7,   grip: 28.9,  force: 'dispersion', polar: false }
});

export const substance = id => SUBSTANCES[id];
/** The heat that pulls one mole of `id` apart from its neighbours, kJ/mol. */
export const gripOf = id => SUBSTANCES[id].grip;

/** The heat given out when one mole of a gaseous ion is dropped in water, kJ/mol (a positive number is heat out). Marcus 1997, rounded. */
export const HYDRATION = Object.freeze({
  'Li+':  { id: 'Li+',  symbol: 'Li⁺',  charge: 1, r: 76,  out: 519 },
  'Na+':  { id: 'Na+',  symbol: 'Na⁺',  charge: 1, r: 102, out: 409 },
  'K+':   { id: 'K+',   symbol: 'K⁺',   charge: 1, r: 138, out: 322 },
  'Mg2+': { id: 'Mg2+', symbol: 'Mg²⁺', charge: 2, r: 72,  out: 1921 },
  'Ca2+': { id: 'Ca2+', symbol: 'Ca²⁺', charge: 2, r: 100, out: 1577 }
});
export const hydrationOf = id => HYDRATION[id].out;

/* ------------------------------------------------------------------
   LIQUID AND VAPOUR
   ------------------------------------------------------------------ */

/** Antoine constants: log10(P / mmHg) = A − B / (C + T / °C). The range each holds over, in °C. */
export const ANTOINE = Object.freeze({
  H2O:     { A: 8.07131, B: 1730.63, C: 233.426, range: [1, 100] },
  ethanol: { A: 8.20417, B: 1642.89, C: 230.300, range: [0, 100] },
  acetone: { A: 7.02447, B: 1161.0,  C: 224.0,   range: [-30, 80] },
  ether:   { A: 6.92032, B: 1064.07, C: 228.8,   range: [-60, 40] }
});
const KPA_PER_MMHG = 101.325 / 760;

/** The vapour pressure of a liquid at `T` °C, in kPa. */
export function vaporPressure(id, T) {
  const a = ANTOINE[id];
  return 10 ** (a.A - a.B / (a.C + T)) * KPA_PER_MMHG;
}

/** The temperature, °C, at which a liquid's vapour pressure equals the pressure `P` kPa around it: its boiling point there. */
export function boilingPoint(id, P) {
  const a = ANTOINE[id];
  const mm = P / KPA_PER_MMHG;
  return a.B / (a.A - Math.log10(mm)) - a.C;
}

/** Surface tension (mN/m) and viscosity (mPa·s) at 20 °C. CRC. */
export const LIQUID_PROPS = Object.freeze({
  H2O:     { tension: 72.8, viscosity: 1.00 },
  ethanol: { tension: 22.3, viscosity: 1.20 },
  hexane:  { tension: 18.4, viscosity: 0.31 },
  ether:   { tension: 17.0, viscosity: 0.22 },
  glycerol: { tension: 63.4, viscosity: 1412 }
});

/** Water's density, g/cm³: ice at 0 °C and water at 0 °C and 4 °C. CRC. */
export const WATER_DENSITY = Object.freeze({ ice0: 0.9168, water0: 0.99984, water4: 0.99997 });

/* ------------------------------------------------------------------
   HEATING A SAMPLE ACROSS ITS PHASES (water, 1 atm)
   ------------------------------------------------------------------ */

export const PHASE_WATER = Object.freeze({
  M: 18.015, Tm: 0, Tb: 100,
  cSolid: 2.09, cLiquid: 4.184, cGas: 1.97, // J/(g·K)
  fus: 6.01, vap: 40.65                      // kJ/mol
});

/** The heat to take `grams` of water from `T0` to `T1` °C (J), summing each stretch and each change of phase on the way. */
export function heatToReach(grams, T0, T1, P = PHASE_WATER) {
  const n = grams / P.M;
  const up = T1 >= T0;
  const [lo, hi] = up ? [T0, T1] : [T1, T0];
  let q = 0;
  const stretch = (a, b, c) => { const x = Math.max(lo, a), y = Math.min(hi, b); if (y > x) q += grams * c * (y - x); };
  stretch(-Infinity, P.Tm, P.cSolid);
  stretch(P.Tm, P.Tb, P.cLiquid);
  stretch(P.Tb, Infinity, P.cGas);
  if (lo < P.Tm && hi > P.Tm) q += n * P.fus * 1000;
  if (lo < P.Tb && hi > P.Tb) q += n * P.vap * 1000;
  return up ? q : -q;
}

/** The temperature, and what is left of the change of phase, after `q` J go into `grams` of water that starts at `T0` °C (heating only). */
export function planHeating(grams, T0, q, P = PHASE_WATER) {
  const n = grams / P.M;
  let T = T0; let left = q; let phase = T0 < P.Tm ? 'solid' : T0 < P.Tb ? 'liquid' : 'gas';
  let melted = 0; let boiled = 0;
  const climb = (to, c) => { const need = grams * c * (to - T); if (left >= need) { left -= need; T = to; return true; } T += left / (grams * c); left = 0; return false; };
  if (phase === 'solid') {
    if (!climb(P.Tm, P.cSolid)) return { T, phase: 'solid', melted: 0, boiled: 0, flat: false };
    const need = n * P.fus * 1000;
    if (left < need) { melted = left / need; left = 0; return { T: P.Tm, phase: 'melting', melted, boiled: 0, flat: true }; }
    left -= need; melted = 1; phase = 'liquid';
  }
  if (phase === 'liquid') {
    if (!climb(P.Tb, P.cLiquid)) return { T, phase: 'liquid', melted, boiled: 0, flat: false };
    const need = n * P.vap * 1000;
    if (left < need) { boiled = left / need; left = 0; return { T: P.Tb, phase: 'boiling', melted, boiled, flat: true }; }
    left -= need; boiled = 1; phase = 'gas';
  }
  T += left / (grams * P.cGas);
  return { T, phase: 'gas', melted, boiled, flat: false };
}

/* ------------------------------------------------------------------
   SOLUTIONS
   ------------------------------------------------------------------ */

/** Ions per formula unit and molar mass of the salts and solutes the flask bench uses. */
export const SOLUTES = Object.freeze({
  NaCl:    { id: 'NaCl',    formula: 'NaCl',      name: 'sodium chloride',   M: 58.44,  ions: ['Na⁺', 'Cl⁻'] },
  KCl:     { id: 'KCl',     formula: 'KCl',       name: 'potassium chloride', M: 74.55, ions: ['K⁺', 'Cl⁻'] },
  CaCl2:   { id: 'CaCl2',   formula: 'CaCl₂',     name: 'calcium chloride',  M: 110.98, ions: ['Ca²⁺', 'Cl⁻', 'Cl⁻'] },
  NH4NO3:  { id: 'NH4NO3',  formula: 'NH₄NO₃',    name: 'ammonium nitrate',  M: 80.04,  ions: ['NH₄⁺', 'NO₃⁻'] },
  sugar:   { id: 'sugar',   formula: 'C₁₂H₂₂O₁₁', name: 'sucrose',           M: 342.30, ions: [] },
  ethanol: { id: 'ethanol', formula: 'C₂H₅OH',    name: 'ethanol',           M: 46.07,  ions: [] }
});
/** The enthalpy of solution, kJ/mol (positive: the solution cools). CRC. */
export const SOLUTION_ENTHALPY = Object.freeze({ NaCl: 3.9, KCl: 17.2, CaCl2: -81.3, NH4NO3: 25.7 });

export const ionsPerFormula = id => SOLUTES[id].ions.length || 1;
/** Molarity, mol/L, of `grams` of a solute in `litres` of solution. */
export const molarity = (grams, M, litres) => grams / M / litres;
/** The new concentration after taking `V1` of `C1` up to `V2` in all (same units): C2 = C1 V1 / V2. */
export const dilute = (C1, V1, V2) => (C1 * V1) / V2;
/** The volume of stock needed: V1 = C2 V2 / C1. */
export const stockVolume = (C1, C2, V2) => (C2 * V2) / C1;

/* ------------------------------------------------------------------
   PAPER CHROMATOGRAPHY (a model, see the header)
   ------------------------------------------------------------------ */

/** A dye's polarity from 0 (oil-like) to 1 (water-like); a solvent's the same. The paper is polar. */
export const DYES = Object.freeze({
  yellow: { id: 'yellow', name: 'yellow',  p: 0.12 },
  red:    { id: 'red',    name: 'red',     p: 0.5 },
  blue:   { id: 'blue',   name: 'blue',    p: 0.86 }
});
export const SOLVENTS = Object.freeze({
  water:   { id: 'water',   name: 'water',               q: 0.92 },
  mix:     { id: 'mix',     name: 'ethanol and water',   q: 0.5 },
  hexane:  { id: 'hexane',  name: 'hexane and acetone',  q: 0.12 }
});
/** The retention factor of a dye in a solvent: how far the spot goes as a fraction of the solvent front. */
export function retention(dye, solvent) {
  const p = DYES[dye].p; const q = SOLVENTS[solvent].q;
  const mobile = 1 - 1.4 * Math.abs(p - q); // how well the solvent holds this dye
  const paper = 0.3 + 0.6 * p;              // how well the paper holds it: a polar dye sticks harder
  return Math.max(0.03, Math.min(0.97, 1 / (1 + 0.5 * Math.exp(3.5 * (paper - mobile)))));
}

/* ------------------------------------------------------------------
   THE PARTICLE WINDOW
   ------------------------------------------------------------------ */

function rng(name) {
  let a = 2166136261 >>> 0;
  for (const ch of String(name)) a = Math.imul(a ^ ch.charCodeAt(0), 16777619) >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The state of water at `T` °C (1 atm). */
export const stateOfWater = T => (T < PHASE_WATER.Tm ? 'solid' : T < PHASE_WATER.Tb ? 'liquid' : 'gas');

/**
 * The particles of a sample in a window: `n` molecules (each three atoms for water, one dot for an atom), in a unit box, for a state at
 * `T` °C with the piston at `V` (1 is the whole box, 0.35 the most it squeezes). `u` runs across, `v` down (0 at the top), `w` into
 * the box. `speed` is the length of each molecule's streak. `intact` is true for every molecule: nothing in this window ever breaks a
 * bond (a bonded molecule is drawn whole in every state, which is the honest picture).
 */
export function particlesOf({ state, T = 20, V = 1, seed = 'w', n = 12 }) {
  const speed = state === 'solid' ? 0.05 : Math.max(0.12, 0.2 + (T + 60) / 320);
  const out = [];
  if (state === 'solid') {
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 3; k++) out.push({ u: 0.28 + i * 0.44, v: 0.18 + k * 0.3 * V, w: 0.28 + j * 0.44, speed, a: (i * 3 + j + k) * 0.9 });
    return out.slice(0, n);
  }
  const r = rng(`${state}|${seed}`);
  const top = state === 'liquid' ? 1 - 0.46 * V : 0.06 + (1 - V) * 0.5;
  const box = state === 'liquid' ? { u: [0.1, 0.9], v: [top, 0.94], gap: 0.19 } : { u: [0.08, 0.92], v: [top, 0.92], gap: 0.3 };
  for (let tries = 0; out.length < n && tries < 6000; tries++) {
    const p = { u: box.u[0] + r() * (box.u[1] - box.u[0]), v: box.v[0] + r() * (box.v[1] - box.v[0]), w: 0.1 + r() * 0.8, speed, a: r() * 6.28 };
    if (out.every(q => Math.hypot(q.u - p.u, q.v - p.v, q.w - p.w) >= box.gap * (state === 'gas' ? Math.max(0.6, V) : 1))) out.push(p);
  }
  while (out.length < n) out.push({ u: 0.1 + 0.07 * out.length, v: 0.5, w: 0.5, speed, a: 0 });
  return out;
}

/** How much of the unit box a sample's particles fill, 0 to 1: the share of the window between its lowest and highest particle. */
export function spread(parts) {
  const vs = parts.map(p => p.v);
  return Math.max(...vs) - Math.min(...vs);
}

/** What the molecule reader names in a jar: the molecule's formula, or the atoms if the molecule has been split. */
export function readerOf(jar) { return jar.split ? jar.split.join(' and ') : SUBSTANCES[jar.substance]?.formula || jar.substance; }
