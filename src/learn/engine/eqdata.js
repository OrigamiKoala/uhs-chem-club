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
/** Kp from Kc for a change of `dn` moles of gas, at `T` kelvin: Kp = Kc (RT)^dn, R = 0.082057 L·atm/(mol·K). */
export const kpFromKc = (Kc, dn, T) => Kc * Math.pow(R_ATM * T, dn);
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

/* ================================================================== Teeter · q4-properties: the K of a rewritten reaction (CED 7.6) */

/** K printed to three figures; a very large or very small one in the e-form a student types (3.20e-4). */
export function fmtK(K) {
  const k = K * (1 + 1e-9);
  if (k >= 1000 || k < 0.001) {
    const [m, e] = k.toExponential(2).split('e');
    return `${m}e${Number(e)}`;
  }
  return Number(k.toPrecision(3)).toFixed(Math.max(0, 2 - Math.floor(Math.log10(Math.abs(Number(k.toPrecision(3)))))));
}

/** A reaction card as it stands: turned round if flipped, every coefficient times its multiplier. `lhs`, `rhs` are `[[n, species], ...]`. */
export function rewriteCard({ lhs, rhs, flipped = false, scale = 1 }) {
  const [L, R] = flipped ? [rhs, lhs] : [lhs, rhs];
  return { lhs: L.map(([n, s]) => [n * scale, s]), rhs: R.map(([n, s]) => [n * scale, s]) };
}

/** What a set of cards adds up to: species -> signed coefficient (products positive), species that cancel removed. */
export function netOfCards(cards) {
  const net = {};
  for (const c of cards) {
    const t = rewriteCard(c);
    for (const [n, s] of t.rhs) net[s] = (net[s] || 0) + n;
    for (const [n, s] of t.lhs) net[s] = (net[s] || 0) - n;
  }
  for (const s of Object.keys(net)) if (Math.abs(net[s]) < 1e-9) delete net[s];
  return net;
}

/** The two sides of a net, as `[[n, species], ...]` lists. */
export function netSides(net) {
  const lhs = Object.entries(net).filter(([, n]) => n < 0).map(([s, n]) => [-n, s]);
  const rhs = Object.entries(net).filter(([, n]) => n > 0).map(([s, n]) => [n, s]);
  return { lhs, rhs };
}

/** The K a mixture at equilibrium gives a reaction written as `net`: the ratio of the amounts it holds, read with this reaction's powers. */
export const kOfNet = (net, amounts) => ratio(net, amounts);

/**
 * Amounts of a chain of one-for-one steps (S0 ⇌ S1 ⇌ S2 ...) at equilibrium, with `total` shared between them: each step's K is the
 * ratio of the next amount to the one before.
 */
export function chainEquilibrium(Ks, names, total) {
  const rel = [1];
  for (const K of Ks) rel.push(rel[rel.length - 1] * K);
  const sum = rel.reduce((a, b) => a + b, 0);
  return Object.fromEntries(names.map((n, i) => [n, (total * rel[i]) / sum]));
}

const Q4_P = { A: -1, B: -1, C: 1 };
const Q4_P_MIX = iceAmounts(Q4_P, { A: 1, B: 1, C: 0 }, 4).amounts;
const Q4_CHAIN_MIX = chainEquilibrium([0.5, 3.0], ['A', 'B', 'C'], 2.4);

/**
 * The cards of q4. A card printed with K is a given; the K of a card the pan check measures is the ratio of the amounts its mixture
 * holds. `K` on a pan-check card is that measured ratio, never typed in.
 */
export const Q4 = Object.freeze({
  mixP: Q4_P_MIX,
  mixChain: Q4_CHAIN_MIX,
  P: { lhs: [[1, 'A'], [1, 'B']], rhs: [[1, 'C']], K: kOfNet(Q4_P, Q4_P_MIX) },
  chain1: { lhs: [[1, 'A']], rhs: [[1, 'B']], K: kOfNet({ A: -1, B: 1 }, Q4_CHAIN_MIX) },
  chain2: { lhs: [[1, 'B']], rhs: [[1, 'C']], K: kOfNet({ B: -1, C: 1 }, Q4_CHAIN_MIX) },
  // Transfer cards (K given, no mixture on the check for them)
  flipOne: { lhs: [[2, 'D']], rhs: [[1, 'E']], K: 0.8 },
  doubleOne: { lhs: [[1, 'F'], [1, 'G']], rhs: [[1, 'H']], K: 5.0 },
  bothOne: { lhs: [[1, 'M'], [1, 'N']], rhs: [[2, 'O']], K: 0.4 },
  // Written twice as large already (K 36): the card half as large reads at the square root, 6.
  halfOne: { lhs: [[2, 'M'], [2, 'N']], rhs: [[2, 'W']], K: 36 },
  addX: { lhs: [[1, 'X']], rhs: [[1, 'Y']], K: 2.0 },
  addY: { lhs: [[1, 'Y']], rhs: [[1, 'Z']], K: 0.3 },
  // The stack stages
  buildA: { lhs: [[1, 'A'], [1, 'B']], rhs: [[1, 'C']], K: 4.0 },
  buildB: { lhs: [[1, 'D']], rhs: [[1, 'C']], K: 0.5 },
  buildC: { lhs: [[1, 'C']], rhs: [[1, 'E']], K: 3.0 },
  readA: { lhs: [[1, 'X']], rhs: [[1, 'Y']], K: 3.0, scale: 2 },
  readB: { lhs: [[1, 'Z']], rhs: [[2, 'Y']], K: 0.4, flipped: true },
  typedA: { lhs: [[1, 'A']], rhs: [[1, 'B']], K: 0.08 },
  typedB: { lhs: [[1, 'C']], rhs: [[2, 'B']], K: 20 }
});

/** K of one card as it stands, by the rule alone (used only to lay out the answer tiles and to check the stages, never printed as evidence). */
export const kOfCardByRule = (card, { flipped = false, scale = 1 } = {}) => kScale(flipped ? kReverse(card.K) : card.K, scale);

/* ================================================================== Teeter · q5-ice: equilibrium concentrations (CED 7.7) */

/** The change-row chip for a species with signed coefficient `nu`: "−x", "+2x". */
export const iceChipLabel = nu => `${nu < 0 ? '−' : '+'}${Math.abs(nu) === 1 ? '' : Math.abs(nu)}x`;

/** The equilibrium expression of one species: its start and its change chip, "1.0 − x", "2x". */
export function iceExpression(start, nu) {
  const ch = `${Math.abs(nu) === 1 ? '' : Math.abs(nu)}x`;
  if (start === 0) return ch;
  return `${Number(start.toPrecision(3))} ${nu < 0 ? '−' : '+'} ${ch}`;
}

/**
 * The small-x extent: leave the reactants at their start amounts in the ratio and solve for x. For a reaction whose products start at zero
 * x^m · Π ν^ν = K · Π c0^|ν| with m the sum of the product coefficients.
 */
export function approxExtent(species, initial, K) {
  let m = 0; let top = K; let nuProd = 1;
  for (const [name, nu] of Object.entries(species)) {
    if (nu > 0) { m += nu; nuProd *= Math.pow(nu, nu); } else top *= Math.pow(initial[name], -nu);
  }
  return Math.pow(top / nuProd, 1 / m);
}

/** The share of the first reactant's start that has reacted when the reaction settles, as a percentage. */
export function reactedPercent(species, initial, K) {
  const x = iceExtent(species, initial, K);
  const [name, nu] = Object.entries(species).find(([, n]) => n < 0);
  return (100 * -nu * x) / initial[name];
}

/** K from a start and one settled amount: x from the known species, every amount from x, then the ratio. */
export function kFromPartial(species, initial, known) {
  const x = (known.value - (initial[known.name] ?? 0)) / species[known.name];
  const am = {};
  for (const [name, nu] of Object.entries(species)) am[name] = (initial[name] ?? 0) + nu * x;
  return { x, amounts: am, K: ratio(species, am) };
}

/* ------------------------------------------------------------------ the solubility beaker (Teeter q7-dissolve) */

/**
 * The most formula units per litre a beaker can hold dissolved when the water already carries `cat0` of the cation and `an0` of the
 * anion from other sources (a soluble salt with the ion in common, or a mixture). 0 when the ions already present are at or past Ksp.
 * Ideal solution: concentrations stand for activities, no ion pairs, the volume does not change.
 */
export function dissolveCap(ksp, [m, n], cat0 = 0, an0 = 0) {
  if (ionProduct([m, n], cat0, an0) >= ksp) return 0;
  const f = s => m * Math.log(m * s + cat0) + n * Math.log(n * s + an0) - Math.log(ksp);
  let lo = 0, hi = molarSolubility(ksp, [m, n]);
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) < 0) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * A beaker holding `total` mol/L of a salt (dissolved plus solid) in water that already carries `cat0` and `an0` of its ions:
 * what is dissolved, what lies on the floor, the two ion concentrations and the ion product Q.
 */
export function dissolveState(ksp, ions, total, cat0 = 0, an0 = 0) {
  const [m, n] = ions;
  const cap = dissolveCap(ksp, ions, cat0, an0);
  const dissolved = Math.min(total, cap);
  const cat = cat0 + m * dissolved;
  const an = an0 + n * dissolved;
  return { cap, dissolved, solid: total - dissolved, cat, an, Q: ionProduct(ions, cat, an), saturated: total > cap };
}

/**
 * Two solutions mixed, no solid yet: the ion product Q the mixture has, whether it is past Ksp, and (if so) how many mol/L of the salt
 * come out as solid before the ions are back at Ksp.
 */
export function settleMixture(ksp, [m, n], cat0, an0) {
  const Q = ionProduct([m, n], cat0, an0);
  if (!(Q > ksp * (1 + 1e-9))) return { Q, forms: false, precipitate: 0 };
  let lo = 0, hi = Math.min(cat0 / m, an0 / n);
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (ionProduct([m, n], cat0 - m * mid, an0 - n * mid) > ksp) lo = mid; else hi = mid;
  }
  return { Q, forms: true, precipitate: (lo + hi) / 2 };
}

/* ====================================================================== Teeter q2-k and q3-q: the ratio rig and the Q/K gauge
 * (appended by the builder of those two benches; every function pure, nothing here is drawn)
 *
 * A "system" is a reaction with its constant: species with signed coefficients (reactants negative), K, the species left out of the
 * ratio (`skip`: pure solids) and the unit its amounts are in. The rig reads `ratio()` over the arrangement of tiles laid on it; the
 * Q/K gauge reads the same `ratio()` over a mixture and sets it against K. */

export const R_ATM = 0.082057; // L·atm/(mol·K)

export const K_SYSTEMS = Object.freeze({
  ab: { id: 'ab', eq: 'A ⇌ B', species: { A: -1, B: 1 }, K: 2, unit: 'mol/L', kind: 'c', model: true, source: 'model reaction: the pan of q1-both, K = kf/kr = 2' },
  hi: { id: 'hi', eq: 'H₂ + I₂ ⇌ 2 HI', species: { H2: -1, I2: -1, HI: 2 }, names: { H2: 'H₂', I2: 'I₂' }, K: 54, unit: 'mol/L', kind: 'c', T: 698, source: REACTIONS.hi.source },
  n2o4: { id: 'n2o4', eq: '2 NO₂ ⇌ N₂O₄', species: { NO2: -2, N2O4: 1 }, names: { NO2: 'NO₂', N2O4: 'N₂O₄' }, K: 6.7, unit: 'atm', kind: 'p', T: 298, source: REACTIONS.n2o4.source },
  caco3: {
    id: 'caco3', eq: 'CaCO₃(s) ⇌ CaO(s) + CO₂(g)', species: { CaCO3: -1, CaO: 1, CO2: 1 }, names: { CaCO3: 'CaCO₃', CaO: 'CaO', CO2: 'CO₂' },
    skip: ['CaCO3', 'CaO'], K: 0.22, unit: 'atm', units: { CaCO3: 'mol', CaO: 'mol', CO2: 'atm' }, kind: 'p', T: 1073, solid: { V: 10, T: 1073 },
    source: 'decomposition pressure of CaCO₃ near 800 °C (1073 K), about 0.22 atm; the solids are 10 L of vessel at 1073 K'
  },
  so3: { id: 'so3', eq: '2 SO₂ + O₂ ⇌ 2 SO₃', species: { SO2: -2, O2: -1, SO3: 2 }, names: { SO2: 'SO₂', O2: 'O₂', SO3: 'SO₃' }, K: 280, unit: 'mol/L', kind: 'c', T: 1000, source: 'textbook Kc about 2.8 × 10² at 1000 K (cross-check: ΔG° near −10 kJ gives Kp 3.3 per atm, Kc = Kp·RT = 270)' },
  a2b: { id: 'a2b', eq: '2 A ⇌ B', species: { A: -2, B: 1 }, K: 1.2, unit: 'mol/L', kind: 'c', model: true, source: 'model reaction' },
  abc: { id: 'abc', eq: 'A + B ⇌ 2 C', species: { A: -1, B: -1, C: 2 }, K: 3.6, unit: 'mol/L', kind: 'c', model: true, source: 'model reaction' }
});

/** A species as it is printed (subscripts). */
export const spName = (sys, sp) => sys.names?.[sp] ?? sp;

/**
 * The amounts a mixture settles at. Solids are not in the ratio: a vessel with solids settles where the gas holds the pressure K
 * (one gas, coefficient 1), and the solid changes by the moles of gas made, n = P·V/(R·T) (`sys.solid`).
 */
export function settleAmounts(sys, start, K = sys.K) {
  if (sys.solid) {
    const f = sys.solid.V / (R_ATM * sys.solid.T);
    const peq = K;
    const n = (peq - (start.CO2 ?? 0)) * f;
    if (start.CaCO3 - n < 0 || start.CaO + n < 0) throw new Error('not enough solid to reach the pressure');
    return { CaCO3: start.CaCO3 - n, CaO: start.CaO + n, CO2: peq };
  }
  return iceAmounts(sys.species, start, K, sys.skip || []).amounts;
}

/** The ratio of the reaction over a set of amounts: Q for a mixture, K for a settled one. */
export const systemRatio = (sys, amounts) => ratio(sys.species, amounts, sys.skip || []);

/** Net exponent of each species for an arrangement of tiles (`top`, `bottom`: lists of `{sp, p}`). */
export function rigSpecies(top, bottom) {
  const m = {};
  for (const t of top) m[t.sp] = (m[t.sp] || 0) + t.p;
  for (const t of bottom) m[t.sp] = (m[t.sp] || 0) - t.p;
  return m;
}

/** What the rig reads on one pan: the ratio of the laid tiles over that pan's amounts. 1 for an empty rig. */
export const rigReading = (top, bottom, amounts) => ratio(rigSpecies(top, bottom), amounts);

/** Do the readings of the pans agree (all within `tol` of one another)? */
export function readingsAgree(vals, tol = 0.004) {
  if (!vals.length || !vals.every(v => Number.isFinite(v) && v > 0)) return false;
  return Math.max(...vals) <= Math.min(...vals) * (1 + tol);
}

/** Is the arrangement the system's ratio (products over reactants: 'K'), the same turned over ('inverse'), or neither (null)? */
export function rigOrientation(sys, top, bottom) {
  const net = rigSpecies(top, bottom);
  const names = Object.keys(sys.species).filter(s => !(sys.skip || []).includes(s));
  const used = Object.keys(net).filter(s => net[s] !== 0);
  if (used.some(s => !names.includes(s)) || names.some(s => !used.includes(s))) return null;
  if (names.every(s => net[s] === sys.species[s])) return 'K';
  if (names.every(s => net[s] === -sys.species[s])) return 'inverse';
  return null;
}

/**
 * The figures a student gets from the usual slips, for a typed K. `noPower`: coefficients left out; `inverted`: reactants over
 * products; `invertedNoPower`; `multiplied`: each amount times its coefficient instead of raised to it; `added`: the amounts of a side
 * added instead of multiplied.
 */
export function kSlips(sys, amounts) {
  const sp = Object.keys(sys.species).filter(s => !(sys.skip || []).includes(s));
  const prod = fn => sp.reduce((q, s) => q * Math.pow(fn(s), Math.sign(sys.species[s])), 1);
  const right = systemRatio(sys, amounts);
  const side = sg => sp.filter(s => Math.sign(sys.species[s]) === sg).reduce((t, s) => t + Math.pow(amounts[s], Math.abs(sys.species[s])), 0);
  return {
    right,
    noPower: prod(s => amounts[s]),
    inverted: 1 / right,
    invertedNoPower: 1 / prod(s => amounts[s]),
    multiplied: prod(s => Math.abs(sys.species[s]) * amounts[s]),
    added: side(1) / side(-1)
  };
}

/** Where the gauge's needle stands, -1 to 1: log10(Q/K) over `decades` decades each way, clamped to the ends. */
export const gaugePos = (Q, K, decades = 3) => Math.max(-1, Math.min(1, Math.log10(Q / K) / decades));

/** A mixture left to itself: its Q, which way it goes, and the amounts it settles at. */
export function runMixture(sys, amounts) {
  const Q = systemRatio(sys, amounts);
  return { Q, K: sys.K, dir: direction(Q, sys.K, 1e-6), after: settleAmounts(sys, amounts) };
}

/** A number as printed to `sf` significant figures: plain between 0.001 and 100 000, else "m × 10^e". */
export function fmtNum(v, sf = 3) {
  if (!Number.isFinite(v)) return '—';
  if (v === 0) return '0';
  const a = Math.abs(v) * (1 + 1e-12);
  if (a >= 1e5 || a < 1e-3) { const s = sciParts(v, sf); return `${s.m} × 10^${s.e < 0 ? '−' : ''}${Math.abs(s.e)}`; }
  const dec = Math.max(0, sf - 1 - Math.floor(Math.log10(a)));
  return (v * (1 + (v > 0 ? 1e-12 : -1e-12))).toFixed(dec);
}

/** The mantissa (as text, `sf` figures) and exponent of v. */
export function sciParts(v, sf = 2) {
  const a = Math.abs(v) * (1 + 1e-12);
  let e = Math.floor(Math.log10(a));
  let m = a / Math.pow(10, e);
  if (Number(m.toFixed(sf - 1)) >= 10) { m /= 10; e += 1; }
  return { m: (v < 0 ? '-' : '') + m.toFixed(sf - 1), e };
}

/* ================================================================== Teeter · q6-lean: pushing a settled gas (CED 7.9, 7.10) */

/**
 * The gas reactions of the vessel. `Kref` is Kp (atm to the power of the change in gas moles) at `Tref`; K at another temperature follows
 * the van 't Hoff relation with ΔH held constant: ln(K2/K1) = −(ΔH/R)(1/T2 − 1/T1). Held constant, ΔH makes the Haber K a little off the
 * tabulated one far from `Tref` (about a third at 773 K); the bench uses it as the rule it teaches.
 */
export const LEAN_RXNS = Object.freeze({
  haber: {
    id: 'haber', eq: 'N₂ + 3 H₂ ⇌ 2 NH₃', species: { N2: -1, H2: -3, NH3: 2 }, names: { N2: 'N₂', H2: 'H₂', NH3: 'NH₃' }, product: 'NH3',
    dH: -92.2, Tref: 673.15, Kref: 1.64e-4,
    source: 'Kp = 1.64e-4 atm⁻² at 400 °C (Kc = 0.5 L²/mol²); ΔH = −92.2 kJ per mole of reaction'
  },
  n2o4: {
    id: 'n2o4', eq: 'N₂O₄ ⇌ 2 NO₂', species: { N2O4: -1, NO2: 2 }, names: { N2O4: 'N₂O₄', NO2: 'NO₂' }, product: 'NO2',
    dH: 57.2, Tref: 298.15, Kref: 1 / REACTIONS.n2o4.Kp,
    source: 'reciprocal of Kp = 6.7 atm⁻¹ for 2 NO₂ ⇌ N₂O₄ at 298 K; ΔH = +57.2 kJ per mole of reaction (ΔHf NO₂ 33.2, N₂O₄ 9.2 kJ/mol)'
  }
});

/** Chance-free relaxation: every amount moves its share of the way to the new balance by 1 − e^(−k t) after t ticks. */
export const LEAN_RATE = 0.1;
/** The factor a catalyst multiplies the rate by (forward and reverse alike). */
export const LEAN_CAT = 5;

/** Kp at T (kelvin) by the van 't Hoff relation. */
export function leanK(rxn, T) { return rxn.Kref * Math.exp(-((rxn.dH * 1000) / R_GAS) * (1 / T - 1 / rxn.Tref)); }

/** Pressure of each gas (atm) for amounts `n` (mol) in V litres at T. */
export function leanPressures(rxn, n, V, T) {
  const out = {};
  for (const name of Object.keys(rxn.species)) out[name] = (n[name] || 0) * R_ATM * T / V;
  return out;
}

/** Q (in pressures) for the amounts as they stand. 0 when a product is missing. */
export function leanQ(rxn, n, V, T) { return ratio(rxn.species, leanPressures(rxn, n, V, T)); }

/** Total pressure (atm) of the reacting gases and `inert` mol of a gas that does not react. */
export function leanTotalP(rxn, n, V, T, inert = 0) {
  return (Object.keys(rxn.species).reduce((s, k) => s + (n[k] || 0), 0) + inert) * R_ATM * T / V;
}

/** Amounts of the gases once settled: the extent that puts Q on K(T), found by bisection on ln Q − ln K. */
export function leanSettle(rxn, n, V, T) {
  const K = leanK(rxn, T);
  let lo = -Infinity; let hi = Infinity;
  for (const [name, nu] of Object.entries(rxn.species)) {
    const x0 = n[name] || 0;
    if (nu > 0) lo = Math.max(lo, -x0 / nu); else hi = Math.min(hi, x0 / -nu);
  }
  const at = x => { const m = {}; for (const [name, nu] of Object.entries(rxn.species)) m[name] = (n[name] || 0) + nu * x; return m; };
  const f = x => Math.log(leanQ(rxn, at(x), V, T)) - Math.log(K);
  let a = lo + 1e-14 * (1 + Math.abs(lo)); let b = hi - 1e-14 * (1 + Math.abs(hi));
  for (let i = 0; i < 200; i++) { const m = (a + b) / 2; if (f(m) < 0) a = m; else b = m; }
  const x = (a + b) / 2;
  return { x, n: at(x), K, Q: K };
}

/**
 * One change made to a settled (or mixed) vessel. `base` is `{n, V, T}` as it stands; `st` is `{add: {species: mol (negative takes out)},
 * V, T, inert, catalyst}`. Returns the vessel right after the change (`post`, the amounts as they were but Q and K re-read), where it
 * settles (`eq`), the direction Q points, and the rate of settling `k`.
 */
export function leanStress(rxn, base, st = {}) {
  const n = { ...base.n };
  for (const [sp, d] of Object.entries(st.add || {})) n[sp] = Math.max(0, (n[sp] || 0) + d);
  const V = st.V ?? base.V; const T = st.T ?? base.T;
  const K = leanK(rxn, T);
  const Q = leanQ(rxn, n, V, T);
  const eq = leanSettle(rxn, n, V, T);
  const inert = st.inert || 0;
  return {
    base, post: { n, V, T, Q, K, P: leanTotalP(rxn, n, V, T, inert) }, eq: { ...eq, V, T, P: leanTotalP(rxn, eq.n, V, T, inert) },
    dir: direction(Q, K, 1e-6), inert, k: LEAN_RATE * (st.catalyst ? LEAN_CAT : 1)
  };
}

/** The vessel `t` ticks after the change: every amount has moved the share 1 − e^(−k t) of its way. */
export function leanAt(rxn, res, t) {
  const frac = t <= 0 ? 0 : 1 - Math.exp(-res.k * t);
  const n = {};
  for (const [sp, nu] of Object.entries(rxn.species)) n[sp] = res.post.n[sp] + nu * res.eq.x * frac;
  const { V, T, K } = res.post;
  return { n, Q: leanQ(rxn, n, V, T), K, P: leanTotalP(rxn, n, V, T, res.inert), frac };
}

/** The first tick by which the vessel is within `tol` of the way to its balance. */
export const leanSettleTick = (k, tol = 0.02) => Math.ceil(Math.log(1 / tol) / k - 1e-9);

/** Settle `mix` at V and T, then take out all the product `cycles` times, settling again each time; `made` counts what was taken out and what is left. */
export function leanYield(rxn, mix, { V, T, cycles = 0 }) {
  let n = leanSettle(rxn, mix, V, T).n;
  let out = 0;
  for (let c = 0; c < cycles; c++) { out += n[rxn.product]; n = { ...n, [rxn.product]: 0 }; n = leanSettle(rxn, n, V, T).n; }
  return { n, out, made: out + n[rxn.product] };
}

/** The reactions of q5 (ICE tables). K is Kc at the stated temperature; the pans labelled "A ⇌ 2 B" are stand-ins with the K printed on them. */
export const Q5 = Object.freeze({
  hi: { eq: 'H₂ + I₂ ⇌ 2 HI', species: { 'H₂': -1, 'I₂': -1, 'HI': 2 }, K: 54, T: 698 },
  n2o4: { eq: 'N₂O₄ ⇌ 2 NO₂', species: { 'N₂O₄': -1, 'NO₂': 2 }, K: 5.9e-3, T: 298 },
  gen: { eq: 'A ⇌ 2 B', species: { A: -1, B: 2 } }
});

/** `[{name, nu, init}]` for a reaction and its start amounts (species not named start at zero). */
export const iceColumns = (species, init) => Object.entries(species).map(([name, nu]) => ({ name, nu, init: init[name] ?? 0 }));
