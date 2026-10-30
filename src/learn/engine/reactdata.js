/**
 * reactdata.js — The chemistry of Kettle (Unit 7: names, equations, stoichiometry, ions in water, titration, kinds of reaction).
 *
 * PURE: no DOM, no kit, no THREE. Every reading a Kettle bench shows (the needle on a cell of ions, the atoms each side of an
 * equation, the grams a pot makes, the cloud two solutions give, the pH in a flask, the type a reaction belongs to) is the answer of
 * a function here, so the drawn table and the built table cannot disagree and `verify:learn` can recompute any figure a stage
 * relies on. Nothing is authored: a stage hands in what is on the table and the planner says what follows.
 *
 * DATA. Atomic masses are the listed masses the game has used since Tallow (`mass.js`: H 1.0, C 12.0, N 14.0, O 16.0, Na 23.0,
 * Mg 24.3, S 32.1, Cl 35.5) extended with the elements Kettle needs, each to 0.1 u (IUPAC standard atomic weights, rounded). Ions and
 * charges are the AP's; the solubility rules are the AP Chemistry list (CED 4.2). Gas constant and water vapour come from the
 * Bellows tables (`gasdata.js`: R = 0.08206 L·atm/(mol·K)).
 */

/* ------------------------------------------------------------------
   ATOMS
   ------------------------------------------------------------------ */

export const ATOMIC = Object.freeze({
  H: 1.0, Li: 6.9, C: 12.0, N: 14.0, O: 16.0, F: 19.0, Na: 23.0, Mg: 24.3, Al: 27.0, P: 31.0, S: 32.1, Cl: 35.5, K: 39.1,
  Ca: 40.1, Mn: 54.9, Fe: 55.8, Cu: 63.5, Zn: 65.4, Br: 79.9, Ag: 107.9, I: 126.9, Ba: 137.3, Pb: 207.2
});

export const ELEMENT_NAME = Object.freeze({
  H: 'hydrogen', Li: 'lithium', C: 'carbon', N: 'nitrogen', O: 'oxygen', F: 'fluorine', Na: 'sodium', Mg: 'magnesium', Al: 'aluminium',
  P: 'phosphorus', S: 'sulfur', Cl: 'chlorine', K: 'potassium', Ca: 'calcium', Mn: 'manganese', Fe: 'iron', Cu: 'copper', Zn: 'zinc',
  Br: 'bromine', Ag: 'silver', I: 'iodine', Ba: 'barium', Pb: 'lead'
});

const round = (x, d = 6) => Math.round(x * 10 ** d) / 10 ** d;

/* ------------------------------------------------------------------
   FORMULAS
   ------------------------------------------------------------------ */

const SUB = '₀₁₂₃₄₅₆₇₈₉';
/** A count as a subscript (`2` → `₂`); 1 prints nothing. */
export const sub = n => (n === 1 ? '' : String(n).split('').map(d => SUB[+d]).join(''));
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
/** A charge as printed: `2+`, `−`, `3+`. The font has no superscript minus, so the sign is a plain true minus (−) and a plain plus. */
export function chargeText(q) {
  const a = Math.abs(q);
  const digits = a === 1 ? '' : String(a).split('').map(d => SUP[+d]).join('');
  return `${digits}${q > 0 ? '+' : '−'}`;
}

/** Parse a formula (`Ca(NO3)2`, `Fe2O3`, `CH3COOH`) into element counts. Digits only; no charges, no dots. */
export function parseFormula(text) {
  const s = String(text).replace(/[₀-₉]/g, c => String(SUB.indexOf(c)));
  let i = 0;
  function group() {
    const counts = {};
    while (i < s.length) {
      const ch = s[i];
      if (ch === '(') {
        i++;
        const inner = group();
        i++; // ')'
        const n = number();
        for (const [el, k] of Object.entries(inner)) counts[el] = (counts[el] || 0) + k * n;
      } else if (ch === ')') {
        return counts;
      } else if (/[A-Z]/.test(ch)) {
        let el = ch;
        i++;
        while (i < s.length && /[a-z]/.test(s[i])) el += s[i++];
        if (!(el in ATOMIC)) throw new Error(`reactdata: no atomic mass for "${el}" in "${text}"`);
        counts[el] = (counts[el] || 0) + number();
      } else {
        throw new Error(`reactdata: cannot read "${text}" at "${s.slice(i)}"`);
      }
    }
    return counts;
  }
  function number() {
    let n = '';
    while (i < s.length && /[0-9]/.test(s[i])) n += s[i++];
    return n ? +n : 1;
  }
  return group();
}

/** The mass of one mole of a formula, in g/mol (listed masses added up). */
export function molarMass(formula) {
  return round(Object.entries(parseFormula(formula)).reduce((m, [el, n]) => m + n * ATOMIC[el], 0), 4);
}

export const molesOf = (formula, grams) => grams / molarMass(formula);
export const gramsOf = (formula, moles) => moles * molarMass(formula);

/** A formula as printed, with true subscripts: `Ca(NO3)2` → `Ca(NO₃)₂`. */
export function pretty(formula) {
  return String(formula).replace(/([A-Za-z)])(\d+)/g, (_, a, d) => a + sub(+d));
}

/* ------------------------------------------------------------------
   IONS, FORMULAS AND NAMES
   ------------------------------------------------------------------ */

/** Every ion Kettle uses: charge, formula and name (and, for an anion, the stem a name is built from). */
export const IONS = Object.freeze({
  H: { f: 'H', q: 1, name: 'hydrogen' },
  Li: { f: 'Li', q: 1, name: 'lithium' }, Na: { f: 'Na', q: 1, name: 'sodium' }, K: { f: 'K', q: 1, name: 'potassium' },
  Ag: { f: 'Ag', q: 1, name: 'silver' }, NH4: { f: 'NH4', q: 1, name: 'ammonium', poly: true },
  Mg: { f: 'Mg', q: 2, name: 'magnesium' }, Ca: { f: 'Ca', q: 2, name: 'calcium' }, Ba: { f: 'Ba', q: 2, name: 'barium' },
  Zn: { f: 'Zn', q: 2, name: 'zinc' }, Al: { f: 'Al', q: 3, name: 'aluminium' },
  Fe2: { f: 'Fe', q: 2, name: 'iron', roman: 'II' }, Fe3: { f: 'Fe', q: 3, name: 'iron', roman: 'III' },
  Cu1: { f: 'Cu', q: 1, name: 'copper', roman: 'I' }, Cu2: { f: 'Cu', q: 2, name: 'copper', roman: 'II' },
  Pb2: { f: 'Pb', q: 2, name: 'lead', roman: 'II' },
  F: { f: 'F', q: -1, name: 'fluoride' }, Cl: { f: 'Cl', q: -1, name: 'chloride' }, Br: { f: 'Br', q: -1, name: 'bromide' },
  I: { f: 'I', q: -1, name: 'iodide' }, O: { f: 'O', q: -2, name: 'oxide' }, S: { f: 'S', q: -2, name: 'sulfide' },
  NO3: { f: 'NO3', q: -1, name: 'nitrate', poly: true }, OH: { f: 'OH', q: -1, name: 'hydroxide', poly: true },
  SO4: { f: 'SO4', q: -2, name: 'sulfate', poly: true }, CO3: { f: 'CO3', q: -2, name: 'carbonate', poly: true },
  PO4: { f: 'PO4', q: -3, name: 'phosphate', poly: true }, C2H3O2: { f: 'C2H3O2', q: -1, name: 'acetate', poly: true }
});

/** The formula text of an ion with its charge: `Mg²⁺`, `NO₃−`. */
export const ionText = id => `${pretty(IONS[id].f)}${chargeText(IONS[id].q)}`;

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

/**
 * The smallest neutral group a cation and an anion make: how many of each, and the formula as written (a group of atoms that
 * is repeated goes in brackets). `{ nCat, nAn, formula, text }`.
 */
export function ionicFormula(catId, anId) {
  const cat = IONS[catId];
  const an = IONS[anId];
  if (!cat || !an) throw new Error(`reactdata: unknown ion ${catId} / ${anId}`);
  if (cat.q <= 0 || an.q >= 0) throw new Error('reactdata: ionicFormula wants a cation then an anion');
  const g = gcd(cat.q, -an.q);
  const nCat = -an.q / g;
  const nAn = cat.q / g;
  const part = (ion, n) => (n === 1 ? ion.f : ion.poly ? `(${ion.f})${n}` : `${ion.f}${n}`);
  const formula = part(cat, nCat) + part(an, nAn);
  return { nCat, nAn, formula, text: pretty(formula) };
}

/** The net charge of a cell of ions: `{Mg2: 1, Cl: 2}` → 0. */
export function netCharge(counts) {
  return Object.entries(counts).reduce((q, [id, n]) => q + n * IONS[id].q, 0);
}

/** The name of an ionic compound: `sodium chloride`, `iron(III) oxide`. */
export function nameIonic(catId, anId) {
  const cat = IONS[catId];
  const an = IONS[anId];
  return `${cat.name}${cat.roman ? `(${cat.roman})` : ''} ${an.name}`;
}

const PREFIX = ['', 'mono', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa', 'nona', 'deca'];
const STEM = { O: 'oxide', Cl: 'chloride', S: 'sulfide', N: 'nitride', F: 'fluoride', Br: 'bromide', I: 'iodide', H: 'hydride' };

/**
 * The name of a molecular compound of two nonmetals: `CO2` → `carbon dioxide`, `CO` → `carbon monoxide`, `N2O4` → `dinitrogen tetroxide`.
 * The first element takes a prefix only when there is more than one of it; the second always does ("mono" and the "o" of the oxide
 * run together: monoxide, tetroxide, pentoxide).
 */
export function nameMolecular(formula) {
  const counts = parseFormula(formula);
  const els = Object.keys(counts);
  if (els.length !== 2) throw new Error(`reactdata: ${formula} is not a two-element compound`);
  const [a, b] = els;
  const p = n => PREFIX[n];
  const first = `${counts[a] > 1 ? p(counts[a]) : ''}${ELEMENT_NAME[a]}`;
  let pre = p(counts[b]);
  let stem = STEM[b];
  if (stem[0] === 'o' && /[ao]$/.test(pre)) pre = pre.slice(0, -1);
  return `${first} ${pre}${stem}`;
}

/** The AP's acids by formula, in water. */
export const ACIDS = Object.freeze({
  HCl: 'hydrochloric acid', HBr: 'hydrobromic acid', HF: 'hydrofluoric acid', HNO3: 'nitric acid', H2SO4: 'sulfuric acid',
  H3PO4: 'phosphoric acid', H2CO3: 'carbonic acid', CH3COOH: 'acetic acid'
});
export const nameAcid = formula => ACIDS[formula] || null;

/* ------------------------------------------------------------------
   EQUATIONS
   ------------------------------------------------------------------ */

/**
 * Parse `2 H2 + O2 -> 2 H2O` (arrow `->`, `→` or `=`; states `(s) (l) (g) (aq)` optional) into
 * `{ lhs: [{n, f, state}], rhs: [...] }`. A formula may be a bare element or a compound.
 */
export function parseEquation(text) {
  const [l, r] = String(text).split(/->|→|=/);
  if (r == null) throw new Error(`reactdata: no arrow in "${text}"`);
  const side = s => s.split(/\s\+\s|\s*\+\s(?=\d|[A-Z(])/).map(t => t.trim()).filter(Boolean).map(t => {
    const m = /^(\d+)?\s*([A-Za-z0-9()₀-₉]+?)\s*(?:\((s|l|g|aq)\))?$/.exec(t);
    if (!m) throw new Error(`reactdata: cannot read species "${t}" in "${text}"`);
    return { n: m[1] ? +m[1] : 1, f: m[2].replace(/[₀-₉]/g, c => String(SUB.indexOf(c))), state: m[3] || null };
  });
  return { lhs: side(l), rhs: side(r) };
}

/** The atoms of each element on one side of an equation: `{H: 4, O: 2}`. */
export function countAtoms(side) {
  const total = {};
  for (const { n, f } of side) for (const [el, k] of Object.entries(parseFormula(f))) total[el] = (total[el] || 0) + n * k;
  return total;
}

/** Atoms each side of an equation, and whether they agree. */
export function atomLedger(eq) {
  const left = countAtoms(eq.lhs);
  const right = countAtoms(eq.rhs);
  const els = [...new Set([...Object.keys(left), ...Object.keys(right)])];
  const rows = els.map(el => ({ el, left: left[el] || 0, right: right[el] || 0 }));
  return { rows, balanced: rows.every(r => r.left === r.right) };
}
export const isBalanced = eq => atomLedger(eq).balanced;

/**
 * The smallest whole-number coefficients that balance the species of an equation (rows = elements, columns = species, products
 * negative; the null space is one line). Returns `[left coefficients, right coefficients]` or null when the species cannot balance.
 */
export function balance(eq) {
  const species = [...eq.lhs.map(s => ({ ...s, sign: 1 })), ...eq.rhs.map(s => ({ ...s, sign: -1 }))];
  const els = [...new Set(species.flatMap(s => Object.keys(parseFormula(s.f))))];
  // Rational Gauss-Jordan over fractions kept as [num, den].
  const frac = (n, d = 1) => { const g = gcd(n, d) || 1; return d < 0 ? [-n / g, -d / g] : [n / g, d / g]; };
  const mul = (a, b) => frac(a[0] * b[0], a[1] * b[1]);
  const sbt = (a, b) => frac(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
  const div = (a, b) => frac(a[0] * b[1], a[1] * b[0]);
  const M = els.map(el => species.map(s => frac(s.sign * (parseFormula(s.f)[el] || 0))));
  const cols = species.length;
  const pivots = [];
  let row = 0;
  for (let c = 0; c < cols && row < M.length; c++) {
    let p = row;
    while (p < M.length && M[p][c][0] === 0) p++;
    if (p === M.length) continue;
    [M[row], M[p]] = [M[p], M[row]];
    const pv = M[row][c];
    M[row] = M[row].map(x => div(x, pv));
    for (let r = 0; r < M.length; r++) {
      if (r !== row && M[r][c][0] !== 0) {
        const f = M[r][c];
        M[r] = M[r].map((x, k) => sbt(x, mul(f, M[row][k])));
      }
    }
    pivots.push(c);
    row++;
  }
  const free = [...Array(cols).keys()].filter(c => !pivots.includes(c));
  if (free.length !== 1) return null;
  const sol = Array(cols).fill(null);
  sol[free[0]] = frac(1);
  pivots.forEach((c, r) => { sol[c] = frac(-M[r][free[0]][0], M[r][free[0]][1]); });
  const lcm = sol.reduce((l, [, d]) => (l * d) / gcd(l, d), 1);
  let ints = sol.map(([n, d]) => (n * lcm) / d);
  if (ints.some(x => x <= 0)) return null;
  const g = ints.reduce((a, b) => gcd(a, b));
  ints = ints.map(x => x / g);
  return [ints.slice(0, eq.lhs.length), ints.slice(eq.lhs.length)];
}

/** An equation as printed, with true subscripts and states. */
export function equationText(eq) {
  const side = s => s.map(t => `${t.n === 1 ? '' : `${t.n} `}${pretty(t.f)}${t.state ? `(${t.state})` : ''}`).join(' + ');
  return `${side(eq.lhs)} → ${side(eq.rhs)}`;
}

/** The same equation with new coefficients: `withCoefficients(eq, [[2, 1], [2]])`. */
export const withCoefficients = (eq, [l, r]) => ({
  lhs: eq.lhs.map((s, i) => ({ ...s, n: l[i] })),
  rhs: eq.rhs.map((s, i) => ({ ...s, n: r[i] }))
});

/* ------------------------------------------------------------------
   STOICHIOMETRY
   ------------------------------------------------------------------ */

/**
 * Run a balanced equation against what is fed (moles by formula). The smallest `have / coefficient` sets how far it goes (the
 * extent), the species that sets it is limiting, every other reactant has a remainder, and each product is its coefficient times
 * the extent. A reactant not listed is taken to be in plenty (it limits nothing).
 */
export function reactPlan(eq, feedMol) {
  const reactants = eq.lhs;
  const fed = reactants.filter(s => feedMol[s.f] != null);
  if (!fed.length) throw new Error('reactdata: nothing is fed');
  const steps = fed.map(s => ({ f: s.f, k: feedMol[s.f] / s.n }));
  const extent = Math.min(...steps.map(s => s.k));
  const limiting = steps.filter(s => Math.abs(s.k - extent) < 1e-9).map(s => s.f);
  const left = Object.fromEntries(fed.map(s => [s.f, round(feedMol[s.f] - s.n * extent)]));
  const made = Object.fromEntries(eq.rhs.map(s => [s.f, round(s.n * extent)]));
  return { extent: round(extent), limiting, left, made };
}

export const percentYield = (actual, theoretical) => (actual / theoretical) * 100;

export const R_ATM = 0.08206;
/** Litres a gas fills: V = nRT / P, with T in °C and P in atm. */
export const gasVolume = (mol, tC, pAtm) => (mol * R_ATM * (tC + 273.15)) / pAtm;
/** Vapour pressure of water in torr (CRC), for gas collected over water. */
export const WATER_VAPOUR_TORR = Object.freeze({ 20: 17.5, 25: 23.8, 30: 31.8 });

/* ------------------------------------------------------------------
   IONS IN WATER
   ------------------------------------------------------------------ */

const GROUP1 = new Set(['Li', 'Na', 'K', 'NH4']);

/**
 * AP solubility rules (CED 4.2): `'soluble'`, `'insoluble'`, or `'slight'` where the rules call the pair slightly soluble. Ions are
 * `IONS` ids. A pair of two cations or two anions is not a compound and throws.
 */
export function solubility(catId, anId) {
  if (IONS[catId].q <= 0 || IONS[anId].q >= 0) throw new Error('reactdata: solubility wants a cation then an anion');
  if (GROUP1.has(catId)) return 'soluble';
  if (anId === 'NO3' || anId === 'C2H3O2') return 'soluble';
  if (['Cl', 'Br', 'I'].includes(anId)) return ['Ag', 'Pb2', 'Cu1'].includes(catId) ? 'insoluble' : 'soluble';
  if (anId === 'F') return catId === 'Ca' || catId === 'Mg' || catId === 'Ba' || catId === 'Pb2' ? 'insoluble' : 'soluble';
  if (anId === 'SO4') {
    if (['Ba', 'Pb2'].includes(catId)) return 'insoluble';
    return ['Ca', 'Ag'].includes(catId) ? 'slight' : 'soluble';
  }
  if (anId === 'OH') {
    if (catId === 'Ba') return 'soluble';
    return catId === 'Ca' ? 'slight' : 'insoluble';
  }
  if (anId === 'S') return ['Ca', 'Ba', 'Mg'].includes(catId) ? 'soluble' : 'insoluble';
  if (anId === 'CO3' || anId === 'PO4' || anId === 'O') return 'insoluble';
  return 'soluble';
}

/**
 * Two solutions poured together. Each is `{cat, an}` (`IONS` ids). The ions swap partners; a pair that is insoluble leaves the
 * water as a solid, and `H⁺` with `OH⁻` leaves it as water. Returns the solid(s), the spectator ions (those that end up in
 * neither), and the net ionic equation as species lists. Slightly soluble pairs are returned as `slight` and treated as staying in
 * solution (a bench does not use them).
 */
export function planMix(A, B) {
  const pairs = [{ cat: A.cat, an: B.an }, { cat: B.cat, an: A.an }];
  const solids = [];
  let water = false;
  const used = new Set();
  for (const p of pairs) {
    if (p.cat === 'H' && p.an === 'OH') { water = true; used.add('H').add('OH'); continue; }
    const s = solubility(p.cat, p.an);
    if (s === 'insoluble') {
      const f = ionicFormula(p.cat, p.an);
      solids.push({ ...p, ...f });
      used.add(p.cat).add(p.an);
    } else if (s === 'slight') {
      solids.slight = true;
    }
  }
  const ions = [A.cat, A.an, B.cat, B.an];
  const spectators = [...new Set(ions.filter(id => !used.has(id)))];
  const net = {
    lhs: [],
    rhs: []
  };
  for (const s of solids) {
    net.lhs.push({ ion: s.cat, n: s.nCat }, { ion: s.an, n: s.nAn });
    net.rhs.push({ f: s.formula, n: 1, state: 's' });
  }
  if (water) { net.lhs.push({ ion: 'H', n: 1 }, { ion: 'OH', n: 1 }); net.rhs.push({ f: 'H2O', n: 1, state: 'l' }); }
  return { solids, water, precipitates: solids.length > 0, reacts: solids.length > 0 || water, spectators, net };
}

/** A net ionic equation (from `planMix`) as printed. */
export function netIonicText(net) {
  const lhs = net.lhs.map(t => `${t.n === 1 ? '' : `${t.n} `}${ionText(t.ion)}(aq)`).join(' + ');
  const rhs = net.rhs.map(t => `${t.n === 1 ? '' : `${t.n} `}${pretty(t.f)}(${t.state})`).join(' + ');
  return `${lhs} → ${rhs}`;
}

/* ------------------------------------------------------------------
   TITRATION (a strong acid against a strong base, CED 4.6)
   ------------------------------------------------------------------ */

/** pH of the flask after `vBaseMl` of base has been added. `acid {M, mL, nH}` and `base {M, nOH}`; strong against strong. */
export function titrate(acid, base, vBaseMl) {
  const nH = (acid.M * acid.mL * (acid.nH || 1)) / 1000;
  const nOH = (base.M * vBaseMl * (base.nOH || 1)) / 1000;
  const liters = (acid.mL + vBaseMl) / 1000;
  const eqMl = ((acid.M * acid.mL * (acid.nH || 1)) / (base.M * (base.nOH || 1)));
  let pH = 7;
  if (Math.abs(nH - nOH) > 1e-12) pH = nH > nOH ? -Math.log10((nH - nOH) / liters) : 14 + Math.log10((nOH - nH) / liters);
  return { nH: round(nH, 9), nOH: round(nOH, 9), left: round(nH - nOH, 9), pH: round(pH, 3), equivalenceMl: round(eqMl, 6), liters };
}

/** The colour of an indicator at a pH. Phenolphthalein turns pink between 8.2 and 10; methyl orange red to yellow between 3.1 and 4.4. */
export function indicatorColour(indicator, pH) {
  if (indicator === 'phenolphthalein') return pH < 8.2 ? 'colourless' : 'pink';
  if (indicator === 'methyl orange') return pH < 3.1 ? 'red' : pH > 4.4 ? 'yellow' : 'orange';
  throw new Error(`reactdata: no indicator "${indicator}"`);
}

/* ------------------------------------------------------------------
   OXIDATION NUMBERS AND KINDS OF REACTION (CED 4.7 to 4.9)
   ------------------------------------------------------------------ */

const GROUP1_EL = new Set(['Li', 'Na', 'K']);
const GROUP2_EL = new Set(['Mg', 'Ca', 'Ba']);
const HALIDE = new Set(['Cl', 'Br', 'I', 'F']);

/**
 * Oxidation numbers of the elements of a species by the AP's rules, in order: an element alone is 0; F is −1; group 1 is +1; group 2
 * is +2; Al is +3; H is +1 (−1 against a metal); O is −2; a halogen is −1; then the one element left unknown takes what makes the
 * species add to its charge. `charge` is the species' charge (an ion). Returns `{El: n}` or null when the rules do not settle it
 * (two unknowns, or a peroxide, which a bench does not use).
 */
export function oxidationNumbers(formula, charge = 0) {
  const counts = parseFormula(formula);
  const els = Object.keys(counts);
  if (els.length === 1) return { [els[0]]: round(charge / counts[els[0]], 3) };
  const on = {};
  const hasMetal = els.some(e => GROUP1_EL.has(e) || GROUP2_EL.has(e) || e === 'Al');
  for (const e of els) {
    if (e === 'F') on[e] = -1;
    else if (GROUP1_EL.has(e)) on[e] = 1;
    else if (GROUP2_EL.has(e)) on[e] = 2;
    else if (e === 'Al') on[e] = 3;
    else if (e === 'H') on[e] = hasMetal ? -1 : 1;
    else if (e === 'O') on[e] = -2;
  }
  const unknown = els.filter(e => on[e] == null);
  // A halogen is -1 when it is the most electronegative thing left beside one other element (a halide, not an oxoanion).
  if (unknown.length > 1) {
    for (const e of unknown) if (HALIDE.has(e) && !els.includes('O')) on[e] = -1;
  }
  const rest = els.filter(e => on[e] == null);
  if (rest.length > 1) {
    // Two unknowns: a salt of a known polyatomic anion (CuSO4, Fe2(SO4)3). The group's atoms are solved inside it, the metal outside.
    return viaPolyatomic(formula, counts);
  }
  if (rest.length === 1) {
    const known = els.filter(e => e !== rest[0]).reduce((s, e) => s + on[e] * counts[e], 0);
    on[rest[0]] = round((charge - known) / counts[rest[0]], 3);
  } else if (Object.entries(on).reduce((s, [e, n]) => s + n * counts[e], 0) !== charge) {
    return null;
  }
  return on;
}

const POLY_ANION = { SO4: ['S', -2], NO3: ['N', -1], CO3: ['C', -2], PO4: ['P', -3] };

/** A salt of one metal and one known polyatomic anion: the metal takes what balances the groups, the group's centre what balances its oxygens. */
function viaPolyatomic(formula, counts) {
  for (const [g, [centre, q]] of Object.entries(POLY_ANION)) {
    const m = new RegExp(`\\(?${g}\\)?(\\d*)$`).exec(String(formula));
    if (!m) continue;
    const n = m[1] ? +m[1] : 1;
    const per = parseFormula(g);
    const metals = Object.keys(counts).filter(e => !(e in per));
    if (metals.length !== 1) return null;
    const metal = metals[0];
    return { [metal]: round((n * -q) / counts[metal], 3), [centre]: round((q + 2 * per.O) / per[centre], 3), O: -2 };
  }
  return null;
}

/**
 * Which kinds a reaction belongs to (a reaction can be several): `synthesis`, `decomposition`, `combustion` (a fuel with O₂ giving
 * CO₂ and H₂O), `precipitation` (a solid forms from two aqueous reactants), `acid-base` (H⁺ meets OH⁻, or an acid with a base),
 * and `redox` when an element's oxidation numbers on the left differ from those on the right. Species in `eq` carry states.
 */
export function kindsOf(eq) {
  const kinds = new Set();
  const n = side => side.length;
  if (n(eq.lhs) >= 2 && n(eq.rhs) === 1) kinds.add('synthesis');
  if (n(eq.lhs) === 1 && n(eq.rhs) >= 2) kinds.add('decomposition');
  const lf = eq.lhs.map(s => s.f);
  const rf = eq.rhs.map(s => s.f);
  if (lf.includes('O2') && rf.includes('CO2') && rf.includes('H2O') || (lf.includes('O2') && lf.some(f => /^C\d*H\d+/.test(f)) && rf.includes('CO2'))) kinds.add('combustion');
  if (eq.lhs.every(s => s.state === 'aq') && eq.rhs.some(s => s.state === 's')) kinds.add('precipitation');
  if (lf.some(f => parseFormula(f).H && /^H/.test(f) && f !== 'H2' && f !== 'H2O') && lf.some(f => /OH/.test(f))) kinds.add('acid-base');
  const sets = side => {
    const m = {};
    for (const s of side) {
      const on = oxidationNumbers(s.f);
      if (!on) return null;
      for (const [e, v] of Object.entries(on)) (m[e] ||= new Set()).add(v);
    }
    return m;
  };
  const L = sets(eq.lhs);
  const Rr = sets(eq.rhs);
  if (L && Rr) {
    for (const e of Object.keys(L)) {
      const a = [...L[e]].sort().join();
      const b = [...(Rr[e] || [])].sort().join();
      if (a !== b) { kinds.add('redox'); break; }
    }
  }
  return kinds;
}
