/**
 * THE FLASK BENCH'S TABLES — Mirrowen q6 (Taken Into Solution)
 *
 * What the window draws when a solid, a liquid or a made-up flask is put in the flask bench, and the arithmetic of a flask (particles
 * per mole, drops per molarity, the rise of a cup). PURE: no DOM, no three, Node-importable, shared by the drawn and the built table.
 * `matterdata.js` owns the molar masses, the ion lists (`SOLUTES`) and the enthalpies of solution (`SOLUTION_ENTHALPY`); this file adds
 * only what the window and the stages need on top of them.
 *
 * SOURCES.
 *   Ionic radii (Shannon 1976, CRC Handbook, "Ionic radii"): Na+ 102 pm, K+ 138, Ca2+ 100, Cl- 181. Rounded to 1 pm. They set only how
 *   wide a disc is drawn.
 *   Solubility (CRC Handbook, "Aqueous solubility of inorganic compounds" and "Physical constants of organic compounds"):
 *     NaCl 35.9 g per 100 g water at 25 C, insoluble in hexane. Sucrose about 200 g per 100 g water at 25 C, insoluble in hexane.
 *     CaCO3 (chalk) Ksp 3.4e-9, about 0.0013 g per 100 g water, so it stays as grains; insoluble in hexane. SiO2 (quartz sand) insoluble in
 *     both. Paraffin wax: insoluble in water, soluble in hexane (hydrocarbons dissolve in hydrocarbons). Acetone: miscible with water and
 *     with hexane in every proportion (CRC, "Miscibility of organic solvents").
 *   Avogadro constant: 6.02214076e23 per mole (CODATA 2018, exact), printed as 6.022 x 10^23.
 *   Heats of solution: `matterdata.js` `SOLUTION_ENTHALPY` (CRC). A cup of `m` g of water that dissolves `n` mol of a salt changes by
 *   dT = -n dHsoln / (m c) with c = 4.184 J/(g K); the cup's own heat capacity is ignored, as everywhere on the heat kit.
 *
 * WHAT IS A SIMPLIFICATION. The window shows a drop of the flask, not the whole flask: `BOX_PER_M` formula units to every 1.00 mol/L. A
 * dissolved ion is drawn with three water molecules touching it, which is the hydration shell reduced to a picture (the real number of
 * water molecules in the first shell is four to nine and they move). The volume of a solution is taken as the mark on the flask.
 */

import { SOLUTES, SUBSTANCES, molarity, dilute, ionsPerFormula, SOLUTION_ENTHALPY } from './matterdata.js';

export const AVOGADRO = 6.022; // x 10^23 per mole
/** Formula units (or molecules) drawn in the window's drop for every 1.00 mol/L of solution. */
export const BOX_PER_M = 20;

/** Ion and molecule sizes for the window, pm (see the header). `k` is what is drawn. */
const ION = Object.freeze({
  'Na⁺': { k: 'cation', sign: '+', r: 102 },
  'K⁺': { k: 'cation', sign: '+', r: 138 },
  'Ca²⁺': { k: 'cation', sign: '2+', r: 100 },
  'Cl⁻': { k: 'anion', sign: '−', r: 181 }
});

/**
 * Everything the flask bench can hold. `form` says how the window draws it: 'ions', 'molecule' (one blob), 'chain' (a long zigzag), 'small'
 * (a three-atom glyph), or 'grains' (never dissolves). `parts` lists the particles one formula unit becomes.
 */
export const STUFF = Object.freeze({
  NaCl: { id: 'NaCl', form: 'ions', name: 'sodium chloride', formula: 'NaCl', M: SOLUTES.NaCl.M, parts: SOLUTES.NaCl.ions.map(s => ({ sym: s, ...ION[s] })), dry: 'crystals' },
  CaCl2: { id: 'CaCl2', form: 'ions', name: 'calcium chloride', formula: 'CaCl₂', M: SOLUTES.CaCl2.M, parts: SOLUTES.CaCl2.ions.map(s => ({ sym: s, ...ION[s] })), dry: 'crystals' },
  sugar: { id: 'sugar', form: 'molecule', name: 'sugar', formula: SOLUTES.sugar.formula, M: SOLUTES.sugar.M, parts: [{ sym: SOLUTES.sugar.formula, k: 'molecule', sign: '', r: 330 }], dry: 'crystals' },
  chalk: { id: 'chalk', form: 'grains', name: 'chalk', formula: 'CaCO₃', M: 100.09, parts: [{ sym: 'CaCO₃', k: 'grain', sign: '', r: 220 }], dry: 'powder' },
  sand: { id: 'sand', form: 'grains', name: 'sand', formula: 'SiO₂', M: 60.08, parts: [{ sym: 'SiO₂', k: 'grain', sign: '', r: 220 }], dry: 'powder' },
  wax: { id: 'wax', form: 'chain', name: 'wax', formula: 'C₂₅H₅₂', M: 352.7, parts: [{ sym: 'C₂₅H₅₂', k: 'chain', sign: '', r: 380 }], dry: 'solid' },
  acetone: { id: 'acetone', form: 'small', name: 'acetone', formula: SUBSTANCES.acetone.formula, M: SUBSTANCES.acetone.M, parts: [{ sym: SUBSTANCES.acetone.formula, k: 'small', sign: '', r: 230 }], dry: 'liquid' }
});

/** Does it mix all through each liquid? CRC (see the header). */
export const MIXES = Object.freeze({
  NaCl: { water: true, hexane: false },
  CaCl2: { water: true, hexane: false },
  sugar: { water: true, hexane: false },
  chalk: { water: false, hexane: false },
  sand: { water: false, hexane: false },
  wax: { water: false, hexane: true },
  acetone: { water: true, hexane: true }
});

export const dissolves = (sub, solvent = 'water') => Boolean(MIXES[sub]?.[solvent]);

/** Particles one formula unit puts in the water: the ions of an ionic solid, one for a molecule. */
export const particlesPerUnit = sub => (SOLUTES[sub] ? ionsPerFormula(sub) : STUFF[sub].parts.length);

/** The number of particles (in 10^23) that `moles` of a solute puts in the water. */
export const particlesIn = (moles, sub) => moles * particlesPerUnit(sub) * AVOGADRO;

/** The molarity of `grams` of `sub` made up to `mL` of solution. */
export const molarityOf = (sub, grams, mL) => molarity(grams, STUFF[sub].M, mL / 1000);
/** The molarity after `V1` mL of `C1` mol/L is made up to `V2` mL. */
export const dilutedTo = (C1, V1, V2) => dilute(C1, V1, V2);

/** How many formula units the window's drop holds at a molarity: at least one if anything is dissolved. */
export const unitsFor = c => (c > 0 ? Math.max(1, Math.round(c * BOX_PER_M)) : 0);

/** The rise (+) or fall (-) of a cup of `mWater` g that dissolves `moles` of a salt, in degrees. */
export const bathChange = (salt, moles, mWater, c = 4.184) => (-SOLUTION_ENTHALPY[salt] * moles * 1000) / (mWater * c);

/* ------------------------------------------------------------------
   THE DROP IN THE WINDOW
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

/** The window is wider than tall: u runs 0..ASPECT across and v 0..1 down, so every size is in units of the window's height. */
export const ASPECT = 1.5;
/** A particle's drawn radius, as a share of the window's height. */
const radiusOf = part => (part.k === 'chain' ? 0.1 : part.k === 'molecule' ? 0.085 : part.k === 'small' ? 0.05 : part.k === 'grain' ? 0.045 : Math.max(0.036, (part.r / 181) * 0.05));

/**
 * The drop: every particle with its place, for `units` formula units of `sub` in `solvent`. `spreads` is whether the solid goes right
 * through the liquid; if it does not, the units sit packed together, on the bottom, or floating on top if a wax in water.
 * Coordinates: u across (0..ASPECT), v down (0..1). Deterministic for the same arguments.
 */
export function dropOf({ sub, solvent = 'water', units, spreads }) {
  const stuff = STUFF[sub];
  const out = { solvent: [], parts: [], lump: !spreads, shellOn: false };
  const r = rng(`${sub}|${solvent}|${units}|${spreads ? 1 : 0}`);
  const all = [];
  for (let i = 0; i < units; i++) for (const part of stuff.parts) all.push({ ...part, rad: radiusOf(part), unit: i });
  const placed = [];
  const free = (u, v, rad, gap) => placed.every(q => Math.hypot(q.u - u, q.v - v) >= (q.rad + rad) * gap);
  if (spreads) {
    // Largest first, so the small ones fit in the gaps. Each keeps room for the water that touches it.
    out.shellOn = all.length <= 30 && stuff.form === 'ions' && solvent === 'water';
    const gap = out.shellOn ? 2.25 : stuff.form === 'chain' ? 1.15 : 1.35;
    const order = [...all].sort((a, b) => b.rad - a.rad);
    for (const p of order) {
      let spot = null;
      for (let tries = 0; tries < 800 && !spot; tries++) {
        const pad = p.rad + 0.04;
        const u = pad + r() * (ASPECT - 2 * pad);
        const v = pad + r() * (1 - 2 * pad);
        if (free(u, v, p.rad, gap * Math.max(0.5, 1 - tries / 1600))) spot = { u, v };
      }
      if (!spot) spot = { u: p.rad + 0.05 + r() * (ASPECT - 2 * p.rad - 0.1), v: p.rad + 0.05 + r() * (1 - 2 * p.rad - 0.1) };
      placed.push({ ...p, ...spot, a: r() * Math.PI * 2 });
    }
  } else {
    // Packed in rows from a corner: the floor for a solid heavier than the liquid, the top for wax floating on water.
    const top = sub === 'wax' && solvent === 'water';
    const rad = all.length ? Math.max(...all.map(p => p.rad)) : 0.05;
    const step = rad * 2.05;
    const perRow = Math.max(1, Math.floor((ASPECT * 0.5) / step));
    all.forEach((p, i) => {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      const u = 0.07 + rad + col * step + (row % 2 ? step * 0.5 : 0);
      const v = top ? 0.07 + rad + row * step * 0.9 : 0.93 - rad - row * step * 0.9;
      placed.push({ ...p, u, v, a: (i * 1.7) % 6.28 });
    });
  }
  out.parts = placed.map(p => ({ k: p.k, sym: p.sym, sign: p.sign, rad: p.rad, u: p.u, v: p.v, a: p.a, unit: p.unit }));
  // The liquid's own molecules, a loose grid with a hand of jitter, left out wherever a particle stands.
  const cols = 9; const rows = 5;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const u = ((i + 0.5) / cols) * ASPECT + (r() - 0.5) * 0.06;
    const v = (j + 0.5) / rows + (r() - 0.5) * 0.06;
    if (out.parts.every(q => Math.hypot(q.u - u, q.v - v) > q.rad + 0.07)) out.solvent.push({ u, v, a: r() * Math.PI * 2 });
  }
  return out;
}

/** The counts a drop shows: its particles by kind. Read off the drawn drop, so a number printed on the window is always the picture's. */
export function countsOf(drop) {
  const by = {};
  for (const p of drop.parts) by[p.k] = (by[p.k] || 0) + 1;
  return { total: drop.parts.length, by };
}
