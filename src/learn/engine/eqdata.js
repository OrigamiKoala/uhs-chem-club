/**
 * THE EQUILIBRIUM TABLES AND PLANNERS — Teeter (Unit 8)
 *
 * Pure functions, no DOM. Every number on the pans, the Q/K gauge, the ICE board, the solubility beaker and the favourability
 * plotter comes from here, so the drawn and the built twin of a bench read the same value. Nothing here is typed in by a stage.
 *
 * SIMPLIFICATION (stated on the bench): the pans model treats a reversible reaction as one-step collisions. For A ⇌ B each particle
 * of A changes with a fixed chance per tick (kf) and each particle of B changes back with a fixed chance (kr), so the rates are
 * proportional to the amounts and the equilibrium constant is K = kf / kr. Real reactions need not be one-step.
 */

export const R_GAS = 8.314; // J/(mol·K)

/* ------------------------------------------------------------------ data tables */

/** Ksp at 25 °C, CRC Handbook values as printed in general-chemistry texts. n = ions per formula unit: [cation count, anion count]. */
export const KSP = Object.freeze({
  AgCl:    { formula: 'AgCl',    ksp: 1.8e-10, ions: [1, 1], cation: 'Ag⁺',  anion: 'Cl⁻' },
  AgBr:    { formula: 'AgBr',    ksp: 5.4e-13, ions: [1, 1], cation: 'Ag⁺',  anion: 'Br⁻' },
  BaSO4:   { formula: 'BaSO₄',   ksp: 1.1e-10, ions: [1, 1], cation: 'Ba²⁺', anion: 'SO₄²⁻' },
  PbI2:    { formula: 'PbI₂',    ksp: 9.8e-9,  ions: [1, 2], cation: 'Pb²⁺', anion: 'I⁻' },
  CaF2:    { formula: 'CaF₂',    ksp: 3.9e-11, ions: [1, 2], cation: 'Ca²⁺', anion: 'F⁻' },
  Mg_OH_2: { formula: 'Mg(OH)₂', ksp: 5.6e-12, ions: [1, 2], cation: 'Mg²⁺', anion: 'OH⁻' },
  Ag2CrO4: { formula: 'Ag₂CrO₄', ksp: 1.1e-12, ions: [2, 1], cation: 'Ag⁺',  anion: 'CrO₄²⁻' }
});

/** Concentration equilibrium constants for the pans (reaction, temperature, Kc). */
export const REACTIONS = Object.freeze({
  hi: { id: 'hi', eq: 'H₂ + I₂ ⇌ 2 HI', T: 698, Kc: 54, species: { H2: -1, I2: -1, HI: 2 }, source: 'tabulated Kc at 698 K (textbook value 54)' },
  n2o4: { id: 'n2o4', eq: '2 NO₂ ⇌ N₂O₄', T: 298, Kp: 6.7, species: { NO2: -2, N2O4: 1 }, source: 'from ΔGf°: N₂O₄ 97.9, NO₂ 51.3 kJ/mol → ΔG° = −4.7 kJ, K = e^(4700/(8.314·298.15))' },
  haber: { id: 'haber', eq: 'N₂ + 3 H₂ ⇌ 2 NH₃', dH: -92.2, species: { N2: -1, H2: -3, NH3: 2 }, source: 'ΔH° = −92.2 kJ per mole of reaction (2 mol NH₃)' }
});

/** Biochemical free energies (pH 7 standard states), Berg, Tymoczko & Stryer. kJ/mol. */
export const COUPLED = Object.freeze({
  atp:  { id: 'atp',  eq: 'ATP + H₂O → ADP + Pᵢ',        dG: -30.5 },
  g6p:  { id: 'g6p',  eq: 'glucose + Pᵢ → glucose-6-phosphate + H₂O', dG: 13.8 }
});

/* ------------------------------------------------------------------ small helpers */

/** Seeded generator (mulberry32) so a stage's pan replays identically at both graphics settings. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ the pans: A ⇌ B */

/** Equilibrium amount of B out of n particles for chances kf (A→B) and kr (B→A). */
export function pansEquilibriumB(n, kf, kr) { return (n * kf) / (kf + kr); }

/** Expected amount of B at tick t starting from b0 (first-order relaxation). */
export function pansExpectedB(n, kf, kr, b0, t) {
  const eq = pansEquilibriumB(n, kf, kr);
  return eq + (b0 - eq) * Math.pow(1 - kf - kr, t);
}

/**
 * Run the pan, particle by particle. Returns per-tick history: `b[t]` is the count of B after tick t (`b[0]` is the start), `fwd[t]` and
 * `rev[t]` are the conversions that happened in tick t (index 0 is 0), and `states[t * n + i]` is 1 when particle i is B after tick t.
 * Particles 0..b0-1 start as B. Each particle changes independently, so the counts scatter around the expected curve; the tallies are
 * the events actually drawn, and the colour of each particle is the one the tallies count.
 */
export function simulatePan({ n, b0, kf, kr, ticks, seed }) {
  const r = rng(seed);
  const states = new Uint8Array((ticks + 1) * n);
  for (let i = 0; i < b0; i++) states[i] = 1;
  const hist = { n, b: [b0], fwd: [0], rev: [0], states };
  let b = b0;
  for (let t = 1; t <= ticks; t++) {
    let f = 0, v = 0;
    for (let i = 0; i < n; i++) {
      const was = states[(t - 1) * n + i];
      let now = was;
      if (was) { if (r() < kr) { now = 0; v++; } } else if (r() < kf) { now = 1; f++; }
      states[t * n + i] = now;
    }
    b += f - v;
    hist.b.push(b); hist.fwd.push(f); hist.rev.push(v);
  }
  return hist;
}

/** Tally over the last `window` ticks ending at `t`. */
export function tallyWindow(hist, t, window) {
  let f = 0, v = 0;
  for (let i = Math.max(1, t - window + 1); i <= t; i++) { f += hist.fwd[i]; v += hist.rev[i]; }
  return { fwd: f, rev: v };
}

/* ------------------------------------------------------------------ the ratio, Q and K */

/**
 * The ratio of a reaction: product of (amount ^ coefficient) for products over reactants, with solids and pure liquids left out.
 * `species` maps name to signed coefficient (reactants negative); `amounts` maps name to concentration or pressure;
 * `skip` is a set of names left out.
 */
export function ratio(species, amounts, skip = []) {
  let q = 1;
  for (const [name, nu] of Object.entries(species)) {
    if (skip.includes(name)) continue;
    q *= Math.pow(amounts[name], nu);
  }
  return q;
}

/** Direction from Q and K: 'forward' when Q < K, 'reverse' when Q > K, 'none' within a relative tolerance. */
export function direction(Q, K, tol = 1e-9) {
  if (Math.abs(Q - K) <= tol * Math.max(Q, K)) return 'none';
  return Q < K ? 'forward' : 'reverse';
}

/* ------------------------------------------------------------------ K rules (7.6) */

export const kReverse = K => 1 / K;
export const kScale = (K, c) => Math.pow(K, c);
export const kAdd = (...Ks) => Ks.reduce((p, k) => p * k, 1);

/* ------------------------------------------------------------------ ICE */

/**
 * Equilibrium extent x for species coefficients (reactants negative) from initial amounts and K, found by bisection on the
 * extent so the check does not share an algebraic route with a stage's closed form. Solids are left out of the ratio via `skip`.
 */
export function iceExtent(species, initial, K, skip = []) {
  let lo = -Infinity, hi = Infinity;
  for (const [name, nu] of Object.entries(species)) {
    const x0 = initial[name] ?? 0;
    // amount = x0 + nu·x must stay >= 0
    if (nu > 0) lo = Math.max(lo, -x0 / nu);
    else hi = Math.min(hi, x0 / -nu);
  }
  const f = x => {
    const am = {};
    for (const [name, nu] of Object.entries(species)) am[name] = (initial[name] ?? 0) + nu * x;
    return Math.log(ratio(species, am, skip)) - Math.log(K);
  };
  let a = lo + 1e-15 * (1 + Math.abs(lo)), b = hi - 1e-15 * (1 + Math.abs(hi));
  for (let i = 0; i < 200; i++) {
    const m = (a + b) / 2;
    if (f(m) < 0) a = m; else b = m;
  }
  return (a + b) / 2;
}

/** Equilibrium amounts for the same inputs. */
export function iceAmounts(species, initial, K, skip = []) {
  const x = iceExtent(species, initial, K, skip);
  const out = {};
  for (const [name, nu] of Object.entries(species)) out[name] = (initial[name] ?? 0) + nu * x;
  return { x, amounts: out };
}

/* ------------------------------------------------------------------ solubility (7.11, 7.12) */

/** Molar solubility s of a salt with [m, n] ions in pure water: Ksp = (m s)^m (n s)^n. */
export function molarSolubility(ksp, [m, n]) {
  return Math.pow(ksp / (Math.pow(m, m) * Math.pow(n, n)), 1 / (m + n));
}

/**
 * Molar solubility with a common ion already present at concentration c (of the cation if `ion` is 'cation', else the anion),
 * by bisection on s in Ksp = (m s + c0)^m (n s)^n etc.
 */
export function solubilityWithCommon(ksp, [m, n], ion, c) {
  const f = s => {
    const cat = m * s + (ion === 'cation' ? c : 0);
    const an = n * s + (ion === 'anion' ? c : 0);
    return Math.pow(cat, m) * Math.pow(an, n) - ksp;
  };
  let lo = 0, hi = molarSolubility(ksp, [m, n]);
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) < 0) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Ion product Q for a mixture against Ksp. */
export function ionProduct([m, n], cat, an) { return Math.pow(cat, m) * Math.pow(an, n); }

/* ------------------------------------------------------------------ free energy (9.5, 9.7) */

/** K from ΔG° (kJ/mol) at T (K): K = e^(−ΔG°/RT), ΔG° converted to J. */
export function kFromDeltaG(dGkJ, T = 298.15) { return Math.exp(-(dGkJ * 1000) / (R_GAS * T)); }
export function deltaGFromK(K, T = 298.15) { return -(R_GAS * T * Math.log(K)) / 1000; }
export const coupledDeltaG = (...dGs) => dGs.reduce((s, g) => s + g, 0);
