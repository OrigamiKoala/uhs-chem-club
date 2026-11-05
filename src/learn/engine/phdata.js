/**
 * THE ACID-BASE TABLES AND PLANNERS — Verdigris (Unit 9)
 *
 * Pure functions, no DOM. Every number on the flasks, the pH meter, the ratio rig, the proton race, the burette and the fraction
 * strip comes from here, so the drawn and the built twin of a bench read the same value. Nothing here is typed in by a stage.
 *
 * SIMPLIFICATIONS (stated on the bench where they matter): activities are taken as concentrations; every solution is at 25 °C
 * unless a stage gives a temperature; volumes add; the solver includes water's own ionization, so a 1e-8 M acid reads 6.98.
 */

/* ------------------------------------------------------------------ data tables */

/** Kw of water by temperature (°C): CRC Handbook values. 25 °C is the CED's 1.0e-14. */
export const KW_TABLE = Object.freeze({ 0: 1.14e-15, 10: 2.93e-15, 20: 6.81e-15, 25: 1.0e-14, 30: 1.47e-14, 40: 2.92e-14, 50: 5.48e-14, 60: 9.61e-14 });
export const KW25 = 1.0e-14;

/**
 * Weak acids and bases at 25 °C. `Ka` is for the acid form named; polyprotic acids list `Ka` as an array. Standard text values
 * (CRC Handbook / general chemistry texts); the CED fixes none of them.
 */
export const ACIDS = Object.freeze({
  hcl:     { id: 'hcl',     name: 'hydrochloric acid', formula: 'HCl',      base: 'Cl⁻',      strong: true },
  hbr:     { id: 'hbr',     name: 'hydrobromic acid',  formula: 'HBr',      base: 'Br⁻',      strong: true },
  hno3:    { id: 'hno3',    name: 'nitric acid',       formula: 'HNO₃',     base: 'NO₃⁻',     strong: true },
  acetic:  { id: 'acetic',  name: 'acetic acid',       formula: 'CH₃COOH',  base: 'CH₃COO⁻',  Ka: 1.8e-5 },
  hf:      { id: 'hf',      name: 'hydrofluoric acid', formula: 'HF',       base: 'F⁻',       Ka: 6.8e-4 },
  hcn:     { id: 'hcn',     name: 'hydrocyanic acid',  formula: 'HCN',      base: 'CN⁻',      Ka: 4.9e-10 },
  hclo:    { id: 'hclo',    name: 'hypochlorous acid', formula: 'HClO',     base: 'ClO⁻',     Ka: 3.0e-8 },
  formic:  { id: 'formic',  name: 'formic acid',       formula: 'HCOOH',    base: 'HCOO⁻',    Ka: 1.8e-4 },
  nh4:     { id: 'nh4',     name: 'ammonium ion',      formula: 'NH₄⁺',     base: 'NH₃',      Ka: KW25 / 1.8e-5 },
  sulfurous: { id: 'sulfurous', name: 'sulfurous acid', formula: 'H₂SO₃',   base: 'HSO₃⁻',    Ka: [1.5e-2, 6.4e-8] }
});

/** Weak bases (Kb at 25 °C). */
export const BASES = Object.freeze({
  nh3:     { id: 'nh3',     name: 'ammonia',           formula: 'NH₃',      acid: 'NH₄⁺',     Kb: 1.8e-5 },
  acetate: { id: 'acetate', name: 'acetate ion',       formula: 'CH₃COO⁻',  acid: 'CH₃COOH',  Kb: KW25 / 1.8e-5 },
  fluoride:{ id: 'fluoride',name: 'fluoride ion',      formula: 'F⁻',       acid: 'HF',       Kb: KW25 / 6.8e-4 }
});

/** pKa values for the proton race of q4 (water-scale values from standard tables; strong acids are textbook estimates). */
export const PKA = Object.freeze({
  HF: 3.17, HCl: -6.3, HBr: -9.0,
  CH4: 50, NH3: 38, H2O: 15.7,
  HClO: 7.5, HClO4: -10,
  acetic: 4.74, ethanol: 15.9, chloroacetic: 2.87, dichloroacetic: 1.29, trichloroacetic: 0.65
});

/** Salts of a strong acid and a strong base: neither ion takes part (q5). */
export const NEUTRAL_SALTS = Object.freeze({
  nacl: { id: 'nacl', name: 'sodium chloride', formula: 'NaCl' },
  kno3: { id: 'kno3', name: 'potassium nitrate', formula: 'KNO₃' }
});

/** Indicators: transition pKa and the colour range (pH). */
export const INDICATORS = Object.freeze({
  methylOrange: { id: 'methylOrange', name: 'methyl orange', pKa: 3.7, range: [3.1, 4.4], acidColour: 'red', baseColour: 'yellow' },
  methylRed:    { id: 'methylRed',    name: 'methyl red',    pKa: 5.1, range: [4.4, 6.2], acidColour: 'red', baseColour: 'yellow' },
  bromothymol:  { id: 'bromothymol',  name: 'bromothymol blue', pKa: 7.0, range: [6.0, 7.6], acidColour: 'yellow', baseColour: 'blue' },
  phenolphthalein: { id: 'phenolphthalein', name: 'phenolphthalein', pKa: 9.3, range: [8.2, 10.0], acidColour: 'colourless', baseColour: 'pink' }
});

/* ------------------------------------------------------------------ small helpers */

export const log10 = Math.log10;
export const pOf = x => -Math.log10(x);

/** Kw at a temperature; between table points the log is interpolated linearly in T. */
export function waterKw(T = 25) {
  if (KW_TABLE[T] != null) return KW_TABLE[T];
  const ts = Object.keys(KW_TABLE).map(Number).sort((a, b) => a - b);
  let lo = ts[0]; let hi = ts[ts.length - 1];
  for (const t of ts) { if (t <= T) lo = t; if (t >= T) { hi = t; break; } }
  if (lo === hi) return KW_TABLE[lo];
  const f = (T - lo) / (hi - lo);
  return 10 ** (Math.log10(KW_TABLE[lo]) * (1 - f) + Math.log10(KW_TABLE[hi]) * f);
}

/** pH of neutral water (equal hydronium and hydroxide). */
export const neutralPH = T => -0.5 * Math.log10(waterKw(T));

/** Print a number with an epsilon so a data row ending in 5 never rounds down (ledger: `toFixed` rounds a half down). */
export const fmt = (v, d = 2) => (Math.abs(v) < 5 * 10 ** (-d - 1) ? (0).toFixed(d) : (v + Math.sign(v) * 1e-9).toFixed(d)).replace('-', '−');
/** A concentration in scientific form with a true minus: "2.4 × 10⁻³"; zero prints as "0". */
export function sci(v, sig = 2) {
  if (!v) return '0';
  let e = Math.floor(Math.log10(Math.abs(v)) + 1e-12);
  let m = v / 10 ** e;
  if (Number((m + 1e-12).toFixed(sig - 1)) >= 10) { e += 1; m = v / 10 ** e; }
  const sup = String(e).replace('-', '⁻').replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
  return `${(m + 1e-12).toFixed(sig - 1)} × 10${sup}`;
}

/* ------------------------------------------------------------------ one solution, one species set */

/**
 * Solve the single-solute cases exactly, water included. The unknown is h = [H₃O⁺]; the charge balance is closed by bisection on
 * log h (monotone), so no approximation (square root, x ≪ c) is assumed anywhere.
 */
function bisectLogH(f, lo = -16, hi = 1) {
  // f(logh) is increasing in logh in the charge-balance forms below: positive charge minus negative charge.
  let a = lo; let b = hi;
  for (let i = 0; i < 200; i++) {
    const m = (a + b) / 2;
    if (f(m) > 0) b = m; else a = m;
  }
  return (a + b) / 2;
}

/** Strong acid (fully ionized) at concentration c (M), n protons each. Returns the full species set. */
export function strongAcid(c, { n = 1, T = 25 } = {}) {
  const Kw = waterKw(T);
  // h = n c + Kw/h  ->  h² − n c h − Kw = 0
  const nc = n * c;
  const h = (nc + Math.sqrt(nc * nc + 4 * Kw)) / 2;
  return { h, oh: Kw / h, pH: pOf(h), pOH: pOf(Kw / h), ionized: 1, acidLeft: 0, base: nc };
}

/** Strong base at concentration c (M), n hydroxides per formula unit (Ba(OH)₂ n = 2). */
export function strongBase(c, { n = 1, T = 25 } = {}) {
  const Kw = waterKw(T);
  const nc = n * c;
  const oh = (nc + Math.sqrt(nc * nc + 4 * Kw)) / 2;
  const h = Kw / oh;
  return { h, oh, pH: pOf(h), pOH: pOf(oh), ionized: 1 };
}

/**
 * Weak monoprotic acid HA, initial c (M), constant Ka. Exact: charge balance h = a + oh, a = c Ka/(h + Ka).
 * `ionized` is the fraction of the acid that has ionized (the percent ionization over 100).
 */
export function weakAcid(Ka, c, { T = 25 } = {}) {
  const Kw = waterKw(T);
  const logh = bisectLogH(lh => { const h = 10 ** lh; return h - (c * Ka) / (h + Ka) - Kw / h; });
  const h = 10 ** logh; const a = (c * Ka) / (h + Ka);
  return { h, oh: Kw / h, pH: pOf(h), pOH: pOf(Kw / h), A: a, HA: c - a, ionized: a / c, percent: (100 * a) / c };
}

/** Weak base B (Kb), initial c. Exact: hydroxide balance oh = bh + h. */
export function weakBase(Kb, c, { T = 25 } = {}) {
  const Kw = waterKw(T);
  const logoh = bisectLogH(lo => { const oh = 10 ** lo; return oh - (c * Kb) / (oh + Kb) - Kw / oh; });
  const oh = 10 ** logoh; const bh = (c * Kb) / (oh + Kb);
  return { oh, h: Kw / oh, pH: pOf(Kw / oh), pOH: pOf(oh), BH: bh, B: c - bh, ionized: bh / c, percent: (100 * bh) / c };
}

/** A salt of a weak acid's conjugate base (sodium acetate, NaF...) at c: weak base with Kb = Kw/Ka. */
export const saltOfWeakAcid = (Ka, c, o) => weakBase(waterKw(o?.T ?? 25) / Ka, c, o);
/** A salt of a weak base's conjugate acid (NH₄Cl...) at c: weak acid with Ka = Kw/Kb. */
export const saltOfWeakBase = (Kb, c, o) => weakAcid(waterKw(o?.T ?? 25) / Kb, c, o);

/* ------------------------------------------------------------------ mixtures and titrations (charge balance) */

/**
 * pH of a general mixture by charge balance. Species are given by total moles in a total volume V (L):
 *   acids:   [{ n, Ka: [Ka1, ...] }]  a weak (poly)protic acid with its totals
 *   strongAcidN / strongBaseN:  moles of strong-acid protons / strong-base hydroxides present (spectator ions are not tracked,
 *   so a base added as NaOH is `Na` = moles of Na⁺);
 *   bases: [{ n, Kb }]   a weak base (NH₃)
 * Charge balance: [H⁺] + [Na⁺-like] + [BH⁺] = [OH⁻] + Σ (charge of A species) + [Cl⁻-like].
 */
export function mixture({ V, acids = [], bases = [], cations = 0, anions = 0, T = 25 }) {
  const Kw = waterKw(T);
  const bal = lh => {
    const h = 10 ** lh;
    let pos = h + cations / V; let neg = Kw / h + anions / V;
    for (const ac of acids) {
      const K = Array.isArray(ac.Ka) ? ac.Ka : [ac.Ka];
      // species fractions a0..aN; the anion charge is Σ i·α_i
      let den = 1; const terms = [1];
      let prod = 1;
      for (let i = 0; i < K.length; i++) { prod *= K[i] / h; terms.push(prod); den += prod; }
      let charge = 0; terms.forEach((t, i) => { charge += i * t / den; });
      neg += (ac.n / V) * charge;
    }
    for (const b of bases) { const Ka = Kw / b.Kb; pos += (b.n / V) * (h / (h + Ka)); }
    return pos - neg;
  };
  const lh = bisectLogH(bal);
  const h = 10 ** lh;
  return { h, oh: Kw / h, pH: pOf(h) };
}

/**
 * A titration of `V0` litres of analyte at concentration `c0` with titrant at `ct`, after `vt` litres of titrant has been added.
 * `analyte`: { type: 'strongAcid' | 'weakAcid' | 'weakBase' | 'diprotic' | 'strongBase', Ka | Kb | Ka:[…] }; the titrant is
 * strong base for acids and strong acid for bases.
 */
export function titrationPH({ analyte, c0, V0, ct, vt, T = 25 }) {
  const V = V0 + vt; const nA = c0 * V0; const nT = ct * vt;
  if (analyte.type === 'strongAcid') return mixture({ V, anions: nA, cations: nT, T });
  if (analyte.type === 'weakAcid') return mixture({ V, acids: [{ n: nA, Ka: analyte.Ka }], cations: nT, T });
  if (analyte.type === 'diprotic') return mixture({ V, acids: [{ n: nA, Ka: analyte.Ka }], cations: nT, T });
  if (analyte.type === 'strongBase') return mixture({ V, cations: nA, anions: nT, T });
  if (analyte.type === 'weakBase') return mixture({ V, bases: [{ n: nA, Kb: analyte.Kb }], anions: nT, T });
  throw new Error(`titrationPH: unknown analyte ${analyte.type}`);
}

/** Equivalence volume (L) for the first proton: moles of analyte over the titrant concentration. */
export const equivalenceVolume = ({ c0, V0, ct }) => (c0 * V0) / ct;

/* ------------------------------------------------------------------ buffers */

/** Henderson–Hasselbalch (the shorthand): pH = pKa + log([A⁻]/[HA]). */
export const hendersonHasselbalch = (pKa, A, HA) => pKa + Math.log10(A / HA);
/** The ratio [A⁻]/[HA] that gives a target pH. */
export const ratioForPH = (pKa, pH) => 10 ** (pH - pKa);

/** The exact pH of an acid HA (Ka) and its salt, with moles `nHA` and `nA` in volume V. Sodium is the spectator. */
export function bufferPH({ Ka, nHA, nA, V, T = 25 }) {
  return mixture({ V, acids: [{ n: nHA + nA, Ka }], cations: nA, T });
}

/** Add `nH` moles of strong acid (as H₃O⁺, chloride spectator) to the buffer; the pH after. */
export function bufferAfterAcid({ Ka, nHA, nA, V, nH, vAdd = 0, T = 25 }) {
  return mixture({ V: V + vAdd, acids: [{ n: nHA + nA, Ka }], cations: nA, anions: nH, T });
}
/** Add `nOH` moles of strong base (sodium hydroxide). */
export function bufferAfterBase({ Ka, nHA, nA, V, nOH, vAdd = 0, T = 25 }) {
  return mixture({ V: V + vAdd, acids: [{ n: nHA + nA, Ka }], cations: nA + nOH, T });
}

/**
 * A flask of `nHA` mol acid and `nA` mol of its salt in `V` L (both 0 = plain water), after `nH` mol of strong acid and `nOH` mol of strong
 * base have been poured in with `vAdd` L of water. Returns the pH and the moles of HA and A⁻ (their sum is the buffer's total).
 */
export function bufferState({ Ka, nHA = 0, nA = 0, V, nH = 0, nOH = 0, vAdd = 0, T = 25 }) {
  const Vt = V + vAdd; const tot = nHA + nA;
  if (!tot) { const m = mixture({ V: Vt, cations: nOH, anions: nH, T }); return { ...m, HA: 0, A: 0, Vt }; }
  const m = mixture({ V: Vt, acids: [{ n: tot, Ka }], cations: nA + nOH, anions: nH, T });
  const A = (tot * Ka) / (m.h + Ka);
  return { ...m, HA: tot - A, A, Vt };
}

/** Fractions of HA and A⁻ at a pH (monoprotic). */
export function fractions(pKa, pH) {
  const r = 10 ** (pH - pKa);
  return { HA: 1 / (1 + r), A: r / (1 + r) };
}

/* ------------------------------------------------------------------ the proton race (q4) */

/**
 * HX (pKa x) competes with HY (pKa y) for one proton among X⁻ and Y⁻. Put the acid HX and the conjugate base Y⁻ in a flask:
 * HX + Y⁻ ⇌ X⁻ + HY, K = 10^(pKa(HY) − pKa(HX)) is large when HX is the stronger acid. Returns the fraction of protons that end on HY
 * (equal amounts of HX and Y⁻ at the start).
 */
export function raceShare(pKaX, pKaY) {
  const K = 10 ** (pKaY - pKaX);
  // x = amount converted; K = x² / (1 − x)²  ->  x = √K / (1 + √K)
  const s = Math.sqrt(K);
  return s / (1 + s);
}

/**
 * The cards of the proton race (q4). Each acid names its leftover base; `pKa` is the planner's only input and is never printed.
 * Acids a bench adds are listed here once, so the race, the checks and the story read one table.
 */
export const RACE = Object.freeze({
  hf:    { id: 'hf',    acid: 'HF',        base: 'F⁻',         pKa: PKA.HF },
  hcl:   { id: 'hcl',   acid: 'HCl',       base: 'Cl⁻',        pKa: PKA.HCl },
  hbr:   { id: 'hbr',   acid: 'HBr',       base: 'Br⁻',        pKa: PKA.HBr },
  ch4:   { id: 'ch4',   acid: 'CH₄',       base: 'CH₃⁻',       pKa: PKA.CH4 },
  nh3:   { id: 'nh3',   acid: 'NH₃',       base: 'NH₂⁻',       pKa: PKA.NH3 },
  h2o:   { id: 'h2o',   acid: 'H₂O',       base: 'OH⁻',        pKa: PKA.H2O },
  hclo:  { id: 'hclo',  acid: 'HClO',      base: 'ClO⁻',       pKa: PKA.HClO },
  hclo2: { id: 'hclo2', acid: 'HClO₂',     base: 'ClO₂⁻',      pKa: 1.96 },
  hclo3: { id: 'hclo3', acid: 'HClO₃',     base: 'ClO₃⁻',      pKa: -1.0 },
  hclo4: { id: 'hclo4', acid: 'HClO₄',     base: 'ClO₄⁻',      pKa: PKA.HClO4 },
  acetic:{ id: 'acetic',acid: 'CH₃COOH',   base: 'CH₃COO⁻',    pKa: PKA.acetic },
  formic:{ id: 'formic',acid: 'HCOOH',     base: 'HCOO⁻',      pKa: 3.75 },
  ethanol:{ id: 'ethanol', acid: 'CH₃CH₂OH', base: 'CH₃CH₂O⁻', pKa: PKA.ethanol },
  cl1:   { id: 'cl1',   acid: 'CH₂ClCOOH', base: 'CH₂ClCOO⁻',  pKa: PKA.chloroacetic },
  cl2:   { id: 'cl2',   acid: 'CHCl₂COOH', base: 'CHCl₂COO⁻',  pKa: PKA.dichloroacetic },
  cl3:   { id: 'cl3',   acid: 'CCl₃COOH',  base: 'CCl₃COO⁻',   pKa: PKA.trichloroacetic }
});

/** Of `n` protons that start on the acid X, how many end on the base left by Y (whole number, the window's count). */
export const raceCount = (idX, idY, n = 100) => Math.round(n * raceShare(RACE[idX].pKa, RACE[idY].pKa));
/** The ids of a set of race cards, strongest acid first. */
export const raceOrder = ids => [...ids].sort((a, b) => RACE[a].pKa - RACE[b].pKa);

/* ------------------------------------------------------------------ helper views used by benches */

/** A solution spec -> the planner's answer. `kind`: 'strongAcid' | 'strongBase' | 'weakAcid' | 'weakBase' | 'saltA' | 'saltB' | 'water'. */
export function solve(spec) {
  const { kind, c = 0, T = 25 } = spec;
  switch (kind) {
    case 'water': { const Kw = waterKw(T); const h = Math.sqrt(Kw); return { h, oh: h, pH: pOf(h), pOH: pOf(h), ionized: null }; }
    case 'strongAcid': return strongAcid(c, { n: spec.n || 1, T });
    case 'strongBase': return strongBase(c, { n: spec.n || 1, T });
    case 'weakAcid': return weakAcid(spec.Ka, c, { T });
    case 'weakBase': return weakBase(spec.Kb, c, { T });
    case 'saltA': return saltOfWeakAcid(spec.Ka, c, { T });
    case 'saltB': return saltOfWeakBase(spec.Kb, c, { T });
    case 'neutralSalt': { const Kw = waterKw(T); const h = Math.sqrt(Kw); return { h, oh: h, pH: pOf(h), pOH: pOf(h) }; }
    default: throw new Error(`solve: unknown kind ${kind}`);
  }
}

/* ------------------------------------------------------------------ the titration bench (q6-titrate): volumes in mL */

/** Sealed unknowns of the titration bench: a strong acid of a strength to find, and a weak acid whose constant is to be found. */
export const TITRATION_UNKNOWNS = Object.freeze({ strong: { c: 0.1256 }, weak: { Ka: 7.0e-6, c: 0.0800 } });

/**
 * A titration in the bench's units. `spec`: { analyte (as `titrationPH`), c0 (M), V0 (mL), ct (M) }. pH after `mL` of titrant.
 */
export function titrationML(spec, mL) {
  return titrationPH({ analyte: spec.analyte, c0: spec.c0, V0: spec.V0 / 1000, ct: spec.ct, vt: mL / 1000 }).pH;
}

/** First equivalence volume in mL (moles of analyte over the titrant strength). */
export const equivalenceML = spec => 1000 * equivalenceVolume({ c0: spec.c0, V0: spec.V0 / 1000, ct: spec.ct });

/** The volume (mL) at which the titration reads `pH`, by bisection (pH is monotone in the volume, up or down). */
export function volumeAtPH(spec, pH, hi = 60) {
  const up = titrationML(spec, hi) > titrationML(spec, 0);
  let a = 0; let b = hi;
  for (let i = 0; i < 80; i++) {
    const m = (a + b) / 2;
    const above = titrationML(spec, m) > pH;
    if (above === up) b = m; else a = m;
  }
  return (a + b) / 2;
}

/** Share of an indicator in its second (base) colour at a pH. */
export const indicatorShare = (ind, pH) => 1 / (1 + 10 ** (ind.pKa - pH));

/** The volumes (mL) between which an indicator changes colour (its pKa less and plus one pH unit), in volume order. */
export function indicatorWindowML(spec, ind, span = 1) {
  const a = volumeAtPH(spec, ind.pKa - span); const b = volumeAtPH(spec, ind.pKa + span);
  return { from: Math.min(a, b), to: Math.max(a, b) };
}

/** True when an indicator's whole colour change falls within `tol` mL of the equivalence volume. */
export function indicatorEndsAtEquivalence(spec, ind, tol = 0.3) {
  const w = indicatorWindowML(spec, ind); const eq = equivalenceML(spec);
  return w.from >= eq - tol && w.to <= eq + tol;
}

/* ------------------------------------------------------------------ q1-handover / q2-scale additions */

/** Strong bases: hydroxides per formula unit and the cation they leave. */
export const STRONG_BASES = Object.freeze({
  naoh:  { id: 'naoh',  name: 'sodium hydroxide', formula: 'NaOH',    cation: 'Na⁺',  n: 1 },
  baoh2: { id: 'baoh2', name: 'barium hydroxide', formula: 'Ba(OH)₂', cation: 'Ba²⁺', n: 2 }
});

/** Mol/L of water itself (about 1000 g/L over 18.0 g/mol): the share of water that has ionized is h over this. */
export const WATER_MOLAR = 55.5;

/** The ions of water, optionally with a strong acid or base added (mol/L), at T. */
export function waterIons({ T = 25, acid = 0, base = 0 } = {}) {
  if (base > 0) { const r = strongBase(base, { T }); return { h: r.h, oh: r.oh }; }
  if (acid > 0) { const r = strongAcid(acid, { T }); return { h: r.h, oh: r.oh }; }
  const h = Math.sqrt(waterKw(T));
  return { h, oh: h };
}

/** Hydrogens and charge of a formula as printed (subscript digits, a trailing ⁺ ⁻ ²⁻). Heavy part = the formula with H and charge removed. */
export function formulaStats(f) {
  const sub = '₀₁₂₃₄₅₆₇₈₉';
  let h = 0; let skel = '';
  for (let i = 0; i < f.length; i++) {
    const ch = f[i];
    if (ch === 'H' && !/[a-z]/.test(f[i + 1] || '')) {
      let n = ''; while (sub.includes(f[i + 1])) { n += sub.indexOf(f[i + 1]); i++; }
      h += n === '' ? 1 : Number(n);
    } else if (ch === '⁺' || ch === '⁻' || ch === '²' || ch === '³') {
      continue;
    } else skel += ch;
  }
  const m = /(²|³)?([⁺⁻])$/.exec(f);
  const charge = m ? (m[2] === '⁺' ? 1 : -1) * (m[1] ? (m[1] === '²' ? 2 : 3) : 1) : 0;
  return { h, charge, skel };
}

/** True when `acid` and `base` are a conjugate pair: the base is the acid less one hydrogen ion. */
export function isConjugate(acid, base) {
  const a = formulaStats(acid); const b = formulaStats(base);
  return a.skel === b.skel && a.h === b.h + 1 && a.charge === b.charge + 1;
}

/** Lewis adduct (q1 stage 7): BF₃ takes the lone pair of NH₃; the reaction goes to completion in the window. */
export const LEWIS = Object.freeze({ acid: 'BF₃', base: 'NH₃', adduct: 'F₃B–NH₃', share: 1 });

/**
 * q2-scale: one strong acid, strong base or pure water in a flask. `id`: a strong acid of ACIDS (`hcl`), a key of STRONG_BASES, or `water`.
 * Returns the species and readings; `ionized` is the fraction of formula units that have come apart (1 for a strong acid or base, the
 * share of the water itself for water, which rounds to none of 200).
 */
export function scaleSolution({ id, c = 0, T = 25 }) {
  if (id === 'water') { const w = waterIons({ T }); return { h: w.h, oh: w.oh, pH: pOf(w.h), pOH: pOf(w.oh), ionized: w.h / WATER_MOLAR, kind: 'water' }; }
  const sb = STRONG_BASES[id];
  if (sb) { const r = strongBase(c, { n: sb.n, T }); return { ...r, kind: 'base', n: sb.n }; }
  const a = ACIDS[id];
  if (a?.strong) { const r = strongAcid(c, { T }); return { ...r, kind: 'acid', n: 1 }; }
  throw new Error(`scaleSolution: unknown solute ${id}`);
}
