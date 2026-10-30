/**
 * THE SEPARATION TABLES — Mirrowen q7 (Pulling Apart)
 *
 * Every figure on the paper strip, the filter, the still, the boiling flask and the plan board comes from the rows and functions below.
 * PURE: no DOM, Node-importable, shared by the drawn and the built tables.
 *
 * SOURCES AND SIMULATIONS.
 *  - Paper strip: ONE SIMULATION. Spot travel is `retention()` in `matterdata.js` (a model of the paper and the solvent competing for each
 *    dye, tuned so a polar solvent carries a polar dye and a nonpolar one leaves it behind). The bench says so. Rf is rounded to 0.01.
 *  - Filter: a filter paper holds back what is wider than its pores (`PAPER_PORE_UM`, Whatman grade 1 particle retention, 11 µm, maker's
 *    figure). Sand is 0.0625 to 2 mm (Wentworth scale), sawdust is 0.1 to 1 mm; a hydrated ion is under 1 nm across and a dye molecule
 *    about 1 to 2 nm (CRC, ionic radii). Only the comparison is used, never printed.
 *  - Still: batch distillation by the Rayleigh method, each instant's vapour taken from a column of `COLUMN_STAGES` equilibrium steps
 *    with Raoult's law (vapour pressure of each liquid from the Antoine fits in `matterdata.js`, NIST). SIMPLIFIED: the liquids are
 *    treated as an ideal mixture (real ethanol and water are not, and cannot be pushed past about 96 % ethanol by distilling); acetone's
 *    fit is used a little past 80 °C, where little acetone is left.
 *  - Boiling flask: boiling-point elevation dT = i Kb m, Kb(water) = 0.512 °C kg/mol (CRC), i = ions per formula unit (ideal: real
 *    salt solutions give a little less). Beyond the exam (CED excludes colligative properties).
 */

import { retention, vaporPressure, PHASE_WATER } from './matterdata.js';

/* ------------------------------------------------------------------
   PAPER STRIP
   ------------------------------------------------------------------ */

/** The solvent front on every run, cm from the start line. */
export const FRONT_CM = 10.0;
export const SOLVENT_ORDER = Object.freeze(['water', 'mix', 'hexane']);
export const SOLVENT_LABEL = Object.freeze({ water: 'Water', mix: 'Ethanol and water', hexane: 'Hexane and acetone' });
export const SOLVENT_SHORT = Object.freeze({ water: 'WATER', mix: 'ETHANOL', hexane: 'HEXANE' });
export const DYE_COLOUR = Object.freeze({ yellow: '#d9b23a', red: '#b8382c', blue: '#5b86b8' });
export const DYE_NAME = Object.freeze({ yellow: 'Yellow', red: 'Red', blue: 'Blue' });
export const INKS = Object.freeze({ black: { id: 'black', name: 'Black ink', dyes: ['yellow', 'red', 'blue'] } });

/** The retention factor of a dye in a solvent, to 0.01. */
export const rfOf = (dye, solvent) => Math.round(retention(dye, solvent) * 100) / 100;
/** Where a dye's spot stands, cm from the start line, when the front has reached `front`. */
export const spotCm = (dye, solvent, front = FRONT_CM) => retention(dye, solvent) * front;
/** The dyes ordered by how far each travelled in a solvent, shortest first. */
export const dyesByTravel = (solvent, dyes = INKS.black.dyes) => [...dyes].sort((a, b) => retention(a, solvent) - retention(b, solvent));

/* ------------------------------------------------------------------
   FILTER
   ------------------------------------------------------------------ */

export const PAPER_PORE_UM = 11;
export const MIXTURES = Object.freeze({
  sand:    { id: 'sand',    name: 'Sand',    sizeUm: 200,    colour: null,      residue: null },
  sawdust: { id: 'sawdust', name: 'Sawdust', sizeUm: 300,    colour: null,      residue: null },
  salt:    { id: 'salt',    name: 'Salt',    sizeUm: 0.0007, colour: null,      residue: 'crust' },
  dye:     { id: 'dye',     name: 'Red dye', sizeUm: 0.0015, colour: '#b8382c', residue: 'stain' }
});

/** What pouring a mixture through the paper does: what stays on the paper, what the cup looks like, and what a dried drop of the cup leaves. */
export function pourThrough(id) {
  const m = MIXTURES[id];
  const onPaper = m.sizeUm >= PAPER_PORE_UM;
  return { onPaper, cup: onPaper ? null : m.colour, dried: onPaper ? 'clean' : m.residue };
}
/** The way to get the solid out of the water: 'filter' when the paper holds it, else 'boil' (the water is boiled off). */
export const methodFor = id => (pourThrough(id).onPaper ? 'filter' : 'boil');

/* ------------------------------------------------------------------
   STILL
   ------------------------------------------------------------------ */

export const STILL_LIQUIDS = Object.freeze(['acetone', 'ethanol', 'H2O']);
export const STILL_NAME = Object.freeze({ acetone: 'acetone', ethanol: 'ethanol', H2O: 'water' });
export const STILL_INK = Object.freeze({ acetone: '#d99a2b', ethanol: '#7fa24a', H2O: '#6f8fb0' });
export const COLUMN_STAGES = 3;
export const STILL_CUTS = 3;
const P_ATM = 101.325;

/** The boiling temperature (°C) of a liquid of mole fractions `x`, and the vapour in equilibrium with it. */
function bubble(ids, x) {
  let lo = 20; let hi = 115;
  for (let k = 0; k < 60; k++) {
    const T = (lo + hi) / 2;
    const s = ids.reduce((a, id, i) => a + x[i] * vaporPressure(id, T), 0);
    if (s > P_ATM) hi = T; else lo = T;
  }
  const T = (lo + hi) / 2;
  return { T, y: ids.map((id, i) => (x[i] * vaporPressure(id, T)) / P_ATM) };
}
const topOf = (ids, x, N) => { let c = x; for (let k = 0; k < N; k++) c = bubble(ids, c).y; return c; };

/** `n` whole cells shared by fractions, largest remainder. */
export function cellsOf(shares, n = 10) {
  const raw = shares.map(s => s * n);
  const out = raw.map(Math.floor);
  let left = n - out.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => [r - out[i], i]).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) { if (left <= 0) break; out[i]++; left--; }
  return out;
}

const CUT_CACHE = new Map();
/**
 * The cuts of a batch distillation of equal moles of `ids`: each cut is a third of the moles taken off the top of the column.
 * Each cut: `T` (mean temperature at the top of the column, °C), `shares` (mole fractions) and `cells` (ten cells, counted).
 */
export function stillCuts(ids = STILL_LIQUIDS, nCuts = STILL_CUTS, stages = COLUMN_STAGES, steps = 300) {
  const key = `${ids.join()}|${nCuts}|${stages}|${steps}`;
  if (CUT_CACHE.has(key)) return CUT_CACHE.get(key);
  const n = ids.map(() => 1);
  const dn = ids.length / (nCuts * steps);
  const out = [];
  for (let c = 0; c < nCuts; c++) {
    const got = ids.map(() => 0); let Ts = 0;
    for (let s = 0; s < steps; s++) {
      const tot = n.reduce((a, b) => a + b, 0);
      const x = n.map(v => v / tot);
      const t = topOf(ids, x, stages);
      Ts += bubble(ids, t).T;
      t.forEach((y, i) => { const d = Math.min(n[i], y * dn); n[i] -= d; got[i] += d; });
    }
    const ct = got.reduce((a, b) => a + b, 0);
    const shares = got.map(v => v / ct);
    out.push({ T: Ts / steps, shares, cells: cellsOf(shares) });
  }
  CUT_CACHE.set(key, out);
  return out;
}
/** The liquids in the order they come over: each by the cut that holds most of it. */
export function comesOverOrder(ids = STILL_LIQUIDS) {
  const cuts = stillCuts(ids);
  const at = id => { const i = ids.indexOf(id); return cuts.reduce((b, c, k) => (c.shares[i] > cuts[b].shares[i] ? k : b), 0); };
  return [...ids].sort((a, b) => at(a) - at(b));
}
/** The cut (0-based) that holds most of a liquid. */
export const richestCut = (id, ids = STILL_LIQUIDS) => { const cuts = stillCuts(ids); const i = ids.indexOf(id); return cuts.reduce((b, c, k) => (c.shares[i] > cuts[b].shares[i] ? k : b), 0); };

/* ------------------------------------------------------------------
   BOILING FLASK (beyond the exam)
   ------------------------------------------------------------------ */

export const KB_WATER = 0.512;
export const WATER_BP = PHASE_WATER.Tb;
export const BOIL_AMOUNTS = Object.freeze([0.5, 1.0, 2.0]);
export const BOIL_SOLUTES = Object.freeze({
  sugar: { id: 'sugar', label: 'Sugar',  shown: 'C₁₂H₂₂O₁₁', i: 1 },
  NaCl:  { id: 'NaCl',  label: 'NaCl',   shown: 'salt',      i: 2 },
  CaCl2: { id: 'CaCl2', label: 'CaCl₂',  shown: '',          i: 3 }
});
/** The rise in boiling point, °C, of `mol` of a solute in `kg` of water: i Kb m. */
export const boilingRise = (solute, mol, kg = 1) => BOIL_SOLUTES[solute].i * KB_WATER * (mol / kg);

/* ------------------------------------------------------------------
   PLAN BOARD
   ------------------------------------------------------------------ */

export const PLAN_PARTS = Object.freeze(['sand', 'salt', 'water']);
export const PLAN_INK = Object.freeze({ sand: '#b79a5f', salt: '#e6e0d0', water: '#6f8fb0' });
/**
 * Run a list of steps ('filter', 'boil', 'strip') on sand in a solution of salt in water, and say where each part ends:
 * on the paper, in the flask, or in the receiver. `moved[k]` is whether step k changed anything.
 */
export function planSeparation(steps) {
  const part = { sand: { at: 'flask', st: 'solid' }, salt: { at: 'flask', st: 'dissolved' }, water: { at: 'flask', st: 'liquid' } };
  const moved = [];
  for (const s of steps) {
    let did = false;
    const wet = part.water.at === 'flask';
    if (s === 'filter' && wet) {
      for (const k of PLAN_PARTS) if (part[k].at === 'flask' && part[k].st === 'solid') { part[k].at = 'paper'; did = true; }
    } else if (s === 'boil' && wet) {
      part.water.at = 'receiver'; did = true;
      for (const k of PLAN_PARTS) if (part[k].at === 'flask' && part[k].st === 'dissolved') part[k].st = 'solid';
    }
    moved.push(did);
  }
  const where = place => PLAN_PARTS.filter(k => part[k].at === place);
  const out = { paper: where('paper'), flask: where('flask'), receiver: where('receiver'), moved };
  out.separated = out.paper.join() === 'sand' && out.flask.join() === 'salt' && out.receiver.join() === 'water';
  return out;
}
