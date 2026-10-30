/**
 * THE JAR TABLES — Mirrowen bench one (`q1-states`): the jars, the press and tank, the particle window and the balance.
 *
 * PURE: no DOM, no three, Node-importable, shared by the drawn and the built table. Every figure a player sees on this bench comes from a
 * row or function here (or from `matterdata.js`, which this file extends and never edits).
 *
 * SOURCES. Melting and boiling points, molar masses: CRC Handbook of Chemistry and Physics (physical constants of inorganic and organic
 * compounds). Carbon dioxide has no liquid at 1 atm: it sublimes at -78.5 degC (CRC). Densities of ice and water at 0 degC: CRC (the
 * `WATER_DENSITY` row of `matterdata.js`, 0.9168 and 0.99984 g/cm3). Steam at 100 degC and 101.3 kPa: IAPWS-95 saturated vapour,
 * 0.598 kg/m3 (rounded to three figures; the ideal-gas value P M / R T is 0.588, 1.6 % lower). The saturation pressure of water at
 * 150 degC is 476 kPa (IAPWS-95): a jar of steam at 150 degC squeezed to a third of its volume reaches 304 kPa and is still a gas, so the
 * press may show it compressing (steam at 110 degC would start to condense at 143 kPa, which is why the press uses 150 degC).
 *
 * ROUNDING. Balance readings are masses of a 1.00 L jar, in grams, to three figures.
 *
 * WHAT IS A SIMPLIFICATION (said on the bench and in the plan). The molecule pictures draw the SAME eight molecules in every state of a
 * jar, so the amount is conserved. Spacing in a gas is drawn about 1.4 times a liquid's; the real figure is about 12 times (the cube root of
 * the 1,670-fold difference in density), which will not fit a card, so the picture shows the direction and not the size.
 */

import { WATER_DENSITY } from './matterdata.js';

/** The substances the jars hold. `mp`/`bp` in degC at 1 atm; `sub` is a sublimation point where there is no liquid. */
export const SAMPLES = Object.freeze({
  H2O:     { id: 'H2O',     name: 'water',          formula: 'H₂O',   M: 18.015, mp: 0,      bp: 100 },
  I2:      { id: 'I2',      name: 'iodine',         formula: 'I₂',    M: 253.81, mp: 113.7,  bp: 184.3 },
  CO2:     { id: 'CO2',     name: 'carbon dioxide', formula: 'CO₂',   M: 44.01,  sub: -78.5 },
  ethanol: { id: 'ethanol', name: 'ethanol',        formula: 'C₂H₅OH', M: 46.07, mp: -114.1, bp: 78.4 },
  Ar:      { id: 'Ar',      name: 'argon',          formula: 'Ar',    M: 39.95,  mp: -189.35, bp: -185.85 }
});

/** The state of a sample at `T` degC and 1 atm. */
export function stateAt(sample, T) {
  const s = SAMPLES[sample];
  if (s.sub != null) return T < s.sub ? 'solid' : 'gas';
  return T < s.mp ? 'solid' : T < s.bp ? 'liquid' : 'gas';
}

/** The press: the pressure in atm at each of the Squeeze dial's four settings. The volume of an (ideal, isothermal) gas is its reciprocal. */
export const SQUEEZE_ATM = Object.freeze([1, 1.5, 2, 3]);
export const SQUEEZE_NAMES = Object.freeze(['Off', 'Light', 'Firm', 'Hard']);

/** The fraction of its volume a sample keeps at Squeeze `level` (counted from 1): a gas follows the pressure, a solid and a liquid do not move. */
export function squeezeRatio(state, level) {
  return state === 'gas' ? 1 / SQUEEZE_ATM[Math.max(0, Math.min(3, level - 1))] : 1;
}

/** What a sample does when poured into an empty wide tank: stays as it is, lies flat in the bottom, or fills it. */
export const pourShape = state => (state === 'solid' ? 'lump' : state === 'liquid' ? 'pool' : 'spread');

/** The heater of the window, degC: the sample's molecules at each setting. Stage 4 runs through all three states, stage 5 does too. */
export const HEATER_TEST = Object.freeze([-10, 20, 110]);
export const HEATER_LOOSE = Object.freeze([-10, 5, 110]);

/* ------------------------------------------------------------------
   THE MOLECULES IN A WINDOW OR A BOX
   ------------------------------------------------------------------ */

/** The frame a window or box draws in, in bond lengths (a water molecule is about 1.6 wide). */
export const FRAME = Object.freeze({ w: 19, h: 13 });

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

/** How far a molecule moves in a moment, in bond lengths: the speed follows the square root of the kelvin temperature; a gas's free path is long. */
export function tailOf(state, T) {
  const k = Math.sqrt((T + 273.15) / 273.15);
  return state === 'gas' ? 3.2 * k : 0.7 * k;
}

/**
 * The molecules of one jar in the frame: `n` of them (or `mols`, a list of molecule ids), as `{x, y, ang, tail, mol}`. A solid is a lattice at the
 * bottom with every molecule turned the same way; a liquid is a pool at the bottom, as close and jumbled; a gas is spread through the frame.
 * The molecules never change: only where they stand.
 */
export function arrange({ state, T = 20, n = 8, seed = 'w', mols = null }) {
  const list = mols || Array.from({ length: n }, () => 'H2O');
  const N = list.length;
  const r = rng(`${state}|${seed}`);
  const { w, h } = FRAME;
  const tail = tailOf(state, T);
  const out = [];
  if (state === 'solid') {
    const cols = Math.ceil(N / 2); const pitch = 3.4;
    const x0 = (w - (cols - 1) * pitch) / 2;
    for (let i = 0; i < N; i++) out.push({ x: x0 + (i % cols) * pitch, y: h - 2.6 - Math.floor(i / cols) * pitch, ang: 0, tail, tx: 0, ty: 0 });
  } else if (state === 'liquid') {
    const cols = Math.ceil(N / 2); const pitch = 3.9;
    const x0 = (w - (cols - 1) * pitch) / 2;
    for (let i = 0; i < N; i++) {
      const row = Math.floor(i / cols);
      out.push({ x: x0 + (i % cols) * pitch + (row ? 1.6 : 0) + (r() - 0.5) * 1.0, y: h - 2.4 - row * 3.3 + (r() - 0.5) * 0.9, ang: r() * 6.28, tail, tx: 0, ty: 0 });
    }
  } else {
    const cols = Math.ceil(Math.sqrt(N * w / h)); const rows = Math.ceil(N / cols);
    const cw = w / cols; const ch = h / rows;
    for (let i = 0; i < N; i++) out.push({ x: (i % cols + 0.5) * cw + (r() - 0.5) * 1.5, y: (Math.floor(i / cols) + 0.5) * ch + (r() - 0.5) * 1.5, ang: r() * 6.28, tail, tx: 0, ty: 0 });
  }
  // Which way each streak points: its own direction, drawn once.
  out.forEach((m, i) => { m.ang2 = r() * 6.28; m.mol = list[i]; });
  return out;
}

/** The nearest neighbour of each molecule: the smallest and the mean. */
export function spacing(parts) {
  const nn = parts.map((p, i) => Math.min(...parts.filter((_, j) => j !== i).map(q => Math.hypot(p.x - q.x, p.y - q.y))));
  return { min: Math.min(...nn), mean: nn.reduce((a, b) => a + b, 0) / nn.length };
}

/** The molecules the window holds for a jar at heater `T`: water is eight H2O whatever the state; a split-water jar is eight H2 and four O2. */
export function windowMolecules(jar, T) {
  if (jar.split) return { state: 'gas', mols: [...Array(8).fill('H2'), ...Array(4).fill('O2')] };
  const state = jar.state || stateAt(jar.sample, T);
  return { state, mols: Array(8).fill(jar.sample) };
}

/** What the reader names for a jar: the formulas of the molecules in the window. */
export function readerNames(jar) {
  if (jar.split) return 'H₂ + O₂';
  return SAMPLES[jar.sample].formula;
}

/* ------------------------------------------------------------------
   THE BALANCE
   ------------------------------------------------------------------ */

/** Density in g/L of water in each state (ice and water at 0 degC, steam at 100 degC and 1 atm). */
export const WATER_G_PER_L = Object.freeze({ solid: WATER_DENSITY.ice0 * 1000, liquid: WATER_DENSITY.water0 * 1000, gas: 0.598 });

/** The mass in grams of a 1.00 L jar of water in `state`, three figures. */
export function jarMass(state, litres = 1) {
  return Number((WATER_G_PER_L[state] * litres).toPrecision(3));
}
