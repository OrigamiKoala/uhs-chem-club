/**
 * ratedata.js — Pure kinetics planners and real reaction data for Quicklight (unit11).
 *
 * Every number the player sees in 2D and 3D comes from these pure functions.
 * Sources for reaction examples and constants:
 *   - 2 N2O5(g) -> 4 NO2(g) + O2(g): classic 1st-order gas-phase decomposition (Brown, LeMay, Bursten)
 *   - 2 NO(g) + O2(g) -> 2 NO2(g): 3rd-order overall, rate = k[NO]^2[O2]
 *   - 2 NO2(g) + F2(g) -> 2 NO2F(g): 2-step mechanism, rate = k[NO2][F2]
 *   - 2 H2O2(aq) -> 2 H2O(l) + O2(g) (I- catalyst): classic 2-step homogeneous catalysis
 *   - 2 NH3(g) -> N2(g) + 3 H2(g) on hot W: 0th-order surface saturation
 *   - 2 NO2(g) -> 2 NO(g) + O2(g): 2nd-order gas-phase decomposition
 */

export const R_KJ = 0.008314462618; // kJ / (mol * K)

export const REACTIONS = {
  n2o5: {
    id: 'n2o5',
    equation: '2 N₂O₅ → 4 NO₂ + O₂',
    order: 1,
    source: 'N₂O₅ decomposition (1st order)'
  },
  no_o2: {
    id: 'no_o2',
    equation: '2 NO + O₂ → 2 NO₂',
    orders: { NO: 2, O2: 1 },
    source: 'NO oxidation (2nd in NO, 1st in O₂)'
  },
  no2_f2: {
    id: 'no2_f2',
    equation: '2 NO₂ + F₂ → 2 NO₂F',
    orders: { NO2: 1, F2: 1 },
    source: 'NO₂ + F₂ two-step mechanism'
  },
  h2o2_cat: {
    id: 'h2o2_cat',
    equation: '2 H₂O₂ → 2 H₂O + O₂',
    catalyst: 'I⁻',
    intermediate: 'IO⁻',
    source: 'Iodide-catalysed H₂O₂ decomposition'
  },
  nh3_w: {
    id: 'nh3_w',
    equation: '2 NH₃ → N₂ + 3 H₂',
    order: 0,
    source: 'NH₃ on hot tungsten (0th order)'
  },
  no2_dim: {
    id: 'no2_dim',
    equation: '2 NO₂ → 2 NO + O₂',
    order: 2,
    source: 'NO₂ decomposition (2nd order)'
  }
};

/**
 * Compute concentration-time curve for an irreversible reaction of order 0, 1, or 2.
 * Supports stoichiometric ratio `stoich = { a, b }` for `a A -> b P`.
 */
export function planKineticsRun({
  order = 1,
  k = 0.05,
  a0 = 0.8,
  tMax = 40,
  nSteps = 80,
  stoich = { a: 1, b: 1 }
} = {}) {
  const points = [];
  const ratio = stoich.b / stoich.a;
  for (let i = 0; i <= nSteps; i++) {
    const t = (tMax * i) / nSteps;
    let A;
    if (order === 0) {
      A = Math.max(0, a0 - k * t);
    } else if (order === 1) {
      A = a0 * Math.exp(-k * t);
    } else {
      A = a0 / (1 + k * a0 * t);
    }
    const P = (a0 - A) * ratio;
    points.push({ t, A, P });
  }

  let initialRate;
  if (order === 0) initialRate = k;
  else if (order === 1) initialRate = k * a0;
  else initialRate = k * a0 * a0;

  const halfLives = [];
  if (order === 1 && k > 0) {
    const tHalf = Math.LN2 / k;
    for (let n = 1; n * tHalf <= tMax + 1e-6; n++) {
      halfLives.push({
        n,
        t: n * tHalf,
        A: a0 * Math.pow(0.5, n)
      });
    }
  } else if (order === 0 && k > 0) {
    const tHalf = a0 / (2 * k);
    if (tHalf <= tMax) halfLives.push({ n: 1, t: tHalf, A: a0 * 0.5 });
  } else if (order === 2 && k > 0 && a0 > 0) {
    const tHalf = 1 / (k * a0);
    if (tHalf <= tMax) halfLives.push({ n: 1, t: tHalf, A: a0 * 0.5 });
  }

  const last = points[points.length - 1];
  return {
    order,
    k,
    a0,
    tMax,
    stoich,
    initialRate,
    points,
    halfLives,
    aEnd: last.A,
    pEnd: last.P
  };
}

/**
 * Compute initial rate for a rate law: rate = k * prod(conc[sp]^orders[sp]).
 */
export function planInitialRate({ k = 1, orders = {}, conc = {} } = {}) {
  let rate = k;
  for (const [sp, ord] of Object.entries(orders)) {
    const c = conc[sp] ?? 0;
    rate *= Math.pow(c, ord);
  }
  return rate;
}

/**
 * Deterministic 2-step mechanism integration:
 *   Mode 'seq':  A -> I (k1),  I -> P (k2)
 *   Mode 'preeq': A + B <-> I (k1f, k1r), I + B -> P (k2)
 */
export function planTwoStepRun({
  mode = 'seq',
  k1f = 0.04,
  k1r = 0,
  k2 = 0.8,
  a0 = 1.0,
  b0 = 1.0,
  tMax = 40,
  nSteps = 80
} = {}) {
  const dt = 0.02;
  const totalSteps = Math.round(tMax / dt);
  const sampleEvery = Math.max(1, Math.round(totalSteps / nSteps));
  let A = a0;
  let B = b0;
  let I = 0;
  let P = 0;
  const points = [{ t: 0, A, B, I, P }];

  for (let s = 1; s <= totalSteps; s++) {
    let dA, dB, dI, dP;
    if (mode === 'seq') {
      const r1 = k1f * A;
      const r2 = k2 * I;
      dA = -r1;
      dB = 0;
      dI = r1 - r2;
      dP = r2;
    } else {
      const r1f = k1f * A * B;
      const r1r = k1r * I;
      const r2 = k2 * I * B;
      dA = -r1f + r1r;
      dB = -r1f + r1r - r2;
      dI = r1f - r1r - r2;
      dP = r2;
    }
    A = Math.max(0, A + dA * dt);
    B = Math.max(0, B + dB * dt);
    I = Math.max(0, I + dI * dt);
    P = Math.max(0, P + dP * dt);
    if (s % sampleEvery === 0 || s === totalSteps) {
      points.push({ t: +(s * dt).toFixed(4), A, B, I, P });
    }
  }
  return { mode, k1f, k1r, k2, a0, b0, tMax, points };
}

/**
 * Transform (t, A) data to [A], ln[A], or 1/[A] and compute linear regression.
 */
export function planPlotTransform(data, mode = 'A') {
  const pts = [];
  for (const row of data) {
    const a = row.A;
    if (a <= 0 && mode !== 'A') continue;
    let y = a;
    if (mode === 'lnA') y = Math.log(a);
    else if (mode === 'invA') y = 1 / a;
    pts.push({ t: row.t, y, A: a });
  }
  const n = pts.length;
  if (n < 2) return { mode, pts, slope: 0, intercept: 0, r2: 0, linear: false };

  let sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
  for (const p of pts) {
    sx += p.t;
    sy += p.y;
    sxx += p.t * p.t;
    sxy += p.t * p.y;
    syy += p.y * p.y;
  }
  const denom = n * sxx - sx * sx;
  const slope = denom === 0 ? 0 : (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;

  let ssRes = 0;
  let ssTot = 0;
  const meanY = sy / n;
  for (const p of pts) {
    const pred = slope * p.t + intercept;
    ssRes += (p.y - pred) * (p.y - pred);
    ssTot += (p.y - meanY) * (p.y - meanY);
  }
  const r2 = ssTot < 1e-12 ? 1 : 1 - ssRes / ssTot;
  return {
    mode,
    pts,
    slope,
    intercept,
    r2,
    linear: r2 > 0.998
  };
}

/**
 * Maxwell-Boltzmann kinetic energy distribution in kJ/mol.
 * f(E) = 2 / sqrt(pi) * (RT)^(-3/2) * sqrt(E) * exp(-E / (RT))
 * Returns bins for plotting and the exact fraction with E >= Ea.
 */
export function planMB({ T = 300, Ea = 52, eMax = 80, nBins = 40 } = {}) {
  const RT = R_KJ * T;
  const norm = (2 / Math.sqrt(Math.PI)) * Math.pow(RT, -1.5);
  const pdf = E => (E <= 0 ? 0 : norm * Math.sqrt(E) * Math.exp(-E / RT));

  const bins = [];
  const dE = eMax / nBins;
  for (let i = 0; i < nBins; i++) {
    const eMid = (i + 0.5) * dE;
    bins.push({
      e0: i * dE,
      e1: (i + 1) * dE,
      eMid,
      density: pdf(eMid),
      above: eMid >= Ea
    });
  }

  // Exact upper tail integral via fine Simpson/midpoint quadrature from 0 to Ea, then 1 - F(Ea)
  const steps = 1000;
  const h = Ea / steps;
  let cdf = 0;
  for (let i = 0; i < steps; i++) {
    const e = (i + 0.5) * h;
    cdf += pdf(e) * h;
  }
  const fractionAbove = Math.max(0, Math.min(1, 1 - cdf));

  return { T, Ea, RT, bins, fractionAbove, percentAbove: fractionAbove * 100 };
}

/**
 * Boss Flare phase planner: generates each phase's parameters from the same kinetics functions.
 */
export function planFoe(phase) {
  switch (phase) {
    case 1:
      // Average rate between t1=5 s (0.50 mol/L) and t2=15 s (0.20 mol/L) -> 0.030 mol/(L*s)
      return {
        phase: 1,
        species: 'Flare Vent Gas',
        t1: 5, c1: 0.50,
        t2: 15, c2: 0.20,
        answer: 0.03
      };
    case 2:
      // Rate law from 3-row log: A + 2 B -> P, rate = k[A]^2[B]^1
      return {
        phase: 2,
        species: 'Flare Feed Manifold',
        orders: { A: 2, B: 1 },
        k: 4.0,
        rows: [
          { A: 0.10, B: 0.10, rate: planInitialRate({ k: 4.0, orders: { A: 2, B: 1 }, conc: { A: 0.10, B: 0.10 } }) },
          { A: 0.20, B: 0.10, rate: planInitialRate({ k: 4.0, orders: { A: 2, B: 1 }, conc: { A: 0.20, B: 0.10 } }) },
          { A: 0.10, B: 0.20, rate: planInitialRate({ k: 4.0, orders: { A: 2, B: 1 }, conc: { A: 0.10, B: 0.20 } }) }
        ]
      };
    case 3:
      // 1st-order decay t1/2 = 12 s, fraction left after 4 half-lives = 1/16 = 0.0625
      return {
        phase: 3,
        species: 'Flare Peroxide Core',
        tHalf: 12,
        halfLivesAsked: 4,
        answer: 0.0625
      };
    case 4:
      // Energy profile: Reactants = 35, TS = 115, Products = 15 -> forward Ea = 80 kJ/mol
      return {
        phase: 4,
        species: 'Flare Ignition Barrier',
        reactants: 35,
        ts: 115,
        products: 15,
        answer: 80
      };
    case 5:
      // Mechanism match: Measured rate = k[X]^2[Y]
      return {
        phase: 5,
        species: 'Flare Additive Chain',
        measuredLaw: 'rate = k[X]²[Y]',
        correctMech: 'mech2'
      };
    default:
      return null;
  }
}
