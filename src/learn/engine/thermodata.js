/**
 * THE THERMODYNAMICS TABLES — Ember Reach (Unit 5)
 *
 * Every figure on the Calorimeter, the Hess Stack, the Microstate Box
 * and the Gibbs Plotter comes from the physical constants and functions
 * below. No stage hand-types a temperature rise, an equilibrium point,
 * a bond sum or a free-energy crossing.
 */

export const SPECIFIC_HEAT_WATER = 4.184; // J/(g·°C)

export const SPECIFIC_HEATS = Object.freeze({
  water:    { id: 'water',    formula: 'H₂O(l)', name: 'water',    c: 4.184, molarMass: 18.015, tint: 'amber'  },
  aluminum: { id: 'aluminum', formula: 'Al(s)',  name: 'aluminum', c: 0.897, molarMass: 26.982, tint: 'bright' },
  iron:     { id: 'iron',     formula: 'Fe(s)',  name: 'iron',     c: 0.449, molarMass: 55.845, tint: 'amber'  },
  copper:   { id: 'copper',   formula: 'Cu(s)',  name: 'copper',     c: 0.385, molarMass: 63.546, tint: 'amber'  },
  silver:   { id: 'silver',   formula: 'Ag(s)',  name: 'silver',   c: 0.235, molarMass: 107.87, tint: 'bright' },
  gold:     { id: 'gold',     formula: 'Au(s)',  name: 'gold',     c: 0.129, molarMass: 196.97, tint: 'amber'  },
});

export const BOND_ENTHALPIES = Object.freeze({
  'H-H':   { bond: 'H–H',   order: 1, dH: 436 },
  'O=O':   { bond: 'O=O',   order: 2, dH: 498 },
  'N≡N':   { bond: 'N≡N',   order: 3, dH: 945 },
  'C-H':   { bond: 'C–H',   order: 1, dH: 413 },
  'C-C':   { bond: 'C–C',   order: 1, dH: 348 },
  'C=C':   { bond: 'C=C',   order: 2, dH: 614 },
  'C≡C':   { bond: 'C≡C',   order: 3, dH: 839 },
  'C-O':   { bond: 'C–O',   order: 1, dH: 358 },
  'C=O':   { bond: 'C=O',   order: 2, dH: 799 }, // in CO₂
  'O-H':   { bond: 'O–H',   order: 1, dH: 463 },
  'Cl-Cl': { bond: 'Cl–Cl', order: 1, dH: 242 },
  'H-Cl':  { bond: 'H–Cl',  order: 1, dH: 431 },
  'N-H':   { bond: 'N–H',   order: 1, dH: 391 },
});

export const FORMATION_TABLE = Object.freeze({
  'H2(g)':        { formula: 'H₂(g)',          name: 'hydrogen gas',     dHf: 0,       S0: 130.7, dGf: 0      },
  'O2(g)':        { formula: 'O₂(g)',          name: 'oxygen gas',       dHf: 0,       S0: 205.2, dGf: 0      },
  'N2(g)':        { formula: 'N₂(g)',          name: 'nitrogen gas',     dHf: 0,       S0: 191.6, dGf: 0      },
  'C(graphite)':  { formula: 'C(s, graphite)', name: 'graphite',         dHf: 0,       S0: 5.7,   dGf: 0      },
  'C(diamond)':   { formula: 'C(s, diamond)',  name: 'diamond',          dHf: 1.9,     S0: 2.4,   dGf: 2.9    },
  'H2O(s)':       { formula: 'H₂O(s)',         name: 'ice',              dHf: -291.8,  S0: 41.0,  dGf: -236.6 },
  'H2O(l)':       { formula: 'H₂O(l)',         name: 'liquid water',     dHf: -285.8,  S0: 69.9,  dGf: -237.1 },
  'H2O(g)':       { formula: 'H₂O(g)',         name: 'water vapour',     dHf: -241.8,  S0: 188.8, dGf: -228.6 },
  'CO(g)':        { formula: 'CO(g)',          name: 'carbon monoxide',  dHf: -110.5,  S0: 197.7, dGf: -137.2 },
  'CO2(g)':       { formula: 'CO₂(g)',         name: 'carbon dioxide',   dHf: -393.5,  S0: 213.8, dGf: -394.4 },
  'CH4(g)':       { formula: 'CH₄(g)',         name: 'methane',          dHf: -74.8,   S0: 186.3, dGf: -50.5  },
  'C2H6(g)':      { formula: 'C₂H₆(g)',        name: 'ethane',           dHf: -84.7,   S0: 229.6, dGf: -32.9  },
  'C3H8(g)':      { formula: 'C₃H₈(g)',        name: 'propane',          dHf: -103.8,  S0: 270.3, dGf: -23.4  },
  'NH3(g)':       { formula: 'NH₃(g)',         name: 'ammonia',          dHf: -45.9,   S0: 192.8, dGf: -16.4  },
  'NO(g)':        { formula: 'NO(g)',          name: 'nitric oxide',     dHf: 90.3,    S0: 210.8, dGf: 86.6   },
  'NO2(g)':       { formula: 'NO₂(g)',         name: 'nitrogen dioxide', dHf: 33.2,    S0: 240.1, dGf: 51.3   },
  'CaO(s)':       { formula: 'CaO(s)',         name: 'calcium oxide',    dHf: -635.1,  S0: 38.1,  dGf: -603.3 },
  'CaCO3(s)':     { formula: 'CaCO₃(s)',       name: 'calcium carbonate',dHf: -1206.9, S0: 91.7,  dGf: -1128.8},
  'Fe(s)':        { formula: 'Fe(s)',          name: 'iron',             dHf: 0,       S0: 27.3,  dGf: 0      },
  'Fe2O3(s)':     { formula: 'Fe₂O₃(s)',       name: 'iron(III) oxide',  dHf: -824.2,  S0: 87.4,  dGf: -742.2 },
});

export const FUELS = Object.freeze({
  hydrogen: { id: 'hydrogen', formula: 'H₂(g)',    name: 'hydrogen', molarMass: 2.016,  dHc: -285.8, kJPerGram: 141.8 },
  methane:  { id: 'methane',  formula: 'CH₄(g)',   name: 'methane',  molarMass: 16.04,  dHc: -890.4, kJPerGram: 55.5  },
  methanol: { id: 'methanol', formula: 'CH₃OH(l)', name: 'methanol', molarMass: 32.04,  dHc: -726.0, kJPerGram: 22.7  },
  carbon:   { id: 'carbon',   formula: 'C(s)',     name: 'carbon',   molarMass: 12.011, dHc: -393.5, kJPerGram: 32.8  },
});

/** Heat transferred into or out of a sample: q = m · c · ΔT (J). */
export function heatTransfer(massG, specificHeat, deltaT) {
  return massG * specificHeat * deltaT;
}

/** Final thermal equilibrium temperature of two contacting bodies (°C). */
export function equilibriumTemp(m1, c1, T1, m2, c2, T2) {
  const cap1 = m1 * c1;
  const cap2 = m2 * c2;
  if (cap1 + cap2 <= 0) return T1;
  return (cap1 * T1 + cap2 * T2) / (cap1 + cap2);
}

/** Specific heat capacity of a hot block dropped into a water bath: c_block = q_water / (m_block · (T_i,block - T_f)). */
export function blockSpecificHeat(mBlock, TBlockInit, mWater, TWaterInit, TFinal, cWater = SPECIFIC_HEAT_WATER) {
  const qWater = mWater * cWater * (TFinal - TWaterInit);
  const drop = TBlockInit - TFinal;
  if (mBlock <= 0 || Math.abs(drop) < 1e-9) return 0;
  return qWater / (mBlock * drop);
}

/** Molar enthalpy of reaction (kJ/mol) from solution heat (J) and moles reacted: ΔH = -q_soln / (1000 · n). */
export function molarEnthalpyFromCup(qSolutionJ, molesReacted) {
  if (molesReacted <= 0) return 0;
  return -qSolutionJ / (1000 * molesReacted);
}

/** Estimate ΔH (kJ/mol) from bonds broken minus bonds formed: Σ D(broken) - Σ D(formed). */
export function bondEnthalpySum(brokenList = [], formedList = []) {
  const broken = brokenList.reduce((acc, item) => {
    const entry = BOND_ENTHALPIES[item.bond];
    const dH = item.dH != null ? item.dH : (entry ? entry.dH : 0);
    return acc + (item.count || 1) * dH;
  }, 0);
  const formed = formedList.reduce((acc, item) => {
    const entry = BOND_ENTHALPIES[item.bond];
    const dH = item.dH != null ? item.dH : (entry ? entry.dH : 0);
    return acc + (item.count || 1) * dH;
  }, 0);
  return { broken, formed, net: broken - formed };
}

/** Sum a stack of Hess's law equation cards. Each step has { dH, flip, mult }. */
export function hessStackEnthalpy(steps = []) {
  return steps.reduce((acc, step) => {
    if (step.enabled === false) return acc;
    const sign = step.flip ? -1 : 1;
    const mult = step.mult != null ? step.mult : 1;
    return acc + sign * mult * step.dH;
  }, 0);
}

/** Standard reaction change from products minus reactants for field ('dHf' | 'S0' | 'dGf'). */
export function standardReactionChange(products = [], reactants = [], field = 'dHf') {
  const prodSum = products.reduce((s, p) => {
    const val = p.val != null ? p.val : (FORMATION_TABLE[p.id]?.[field] ?? 0);
    return s + (p.n || 1) * val;
  }, 0);
  const reactSum = reactants.reduce((s, r) => {
    const val = r.val != null ? r.val : (FORMATION_TABLE[r.id]?.[field] ?? 0);
    return s + (r.n || 1) * val;
  }, 0);
  return prodSum - reactSum;
}

/** Number of distinct microstates for distinguishable particles across `cells` boxes (cells^particles), or Lattice slots C(cells, particles). */
export function microstateWays(cells, particles, distinguishable = false) {
  if (distinguishable) return Math.round(Math.pow(cells, particles));
  if (particles < 0 || particles > cells) return 0;
  let num = 1;
  let den = 1;
  for (let i = 1; i <= particles; i++) {
    num *= (cells - i + 1);
    den *= i;
  }
  return Math.round(num / den);
}

/** Gibbs free energy ΔG = ΔH - T·ΔS (in kJ/mol, with ΔH in kJ/mol and ΔS in J/(mol·K)). */
export function gibbsFreeEnergy(dH_kJ, dS_J_K, T_K) {
  return dH_kJ - (T_K * dS_J_K) / 1000;
}

/** Crossing temperature T = ΔH / ΔS (in K, with ΔH in kJ/mol and ΔS in J/(mol·K)). */
export function crossingTemperature(dH_kJ, dS_J_K) {
  if (Math.abs(dS_J_K) < 1e-9) return null;
  return (dH_kJ * 1000) / dS_J_K;
}

/** Entropy gained by warming a sample without a change of phase: ΔS = m · c · ln(T2 / T1), in J/K, with both temperatures in °C. */
export function entropyOfHeating(massG, specificHeat, T1C, T2C) {
  return massG * specificHeat * Math.log((T2C + 273.15) / (T1C + 273.15));
}

/** Build the live bench configuration object from a stage definition and current interactive state. */
export function benchCfg(stage, state = {}) {
  const dialSpec = stage.dial || null;
  const dialIdx = state.dialIdx ?? (dialSpec?.defaultIndex ?? 0);
  const dialValue = dialSpec?.values ? dialSpec.values[Math.max(0, Math.min(dialSpec.values.length - 1, dialIdx))] : null;
  return {
    mode: stage.mode || 'choice',
    selected: state.selected ?? [],
    buckets: stage.buckets || null,
    assigned: state.assigned || {},
    dialSpec,
    dialIdx,
    dialValue,
    toggled: state.toggled ?? Boolean(stage.defaultToggled),
    cardState: state.cardState || {},
    probedId: state.probedId || null,
  };
}
