/**
 * THE HEATING CURVE AND THE PHASE DIAGRAM — Mirrowen, bench 5 (`q5-crossing`)
 *
 * PURE: no DOM, no three, Node-importable. Everything the curve bench's instruments read comes from here, built on `PHASE_WATER`
 * in `matterdata.js` (CRC Handbook, 1 atm: c(ice) 2.09, c(water) 4.184, c(steam) 1.97 J/(g·K); heat of fusion 6.01 kJ/mol; heat of
 * vaporization 40.65 kJ/mol at 100 °C).
 *
 * THE CURVE. A sample of water is walked along ONE line of heat: `H` is the heat (J) that stands between a state and "solid ice at
 * 0 °C with none of it melted". A state is a temperature plus how much has melted and how much has boiled. `planThermal` adds a signed
 * heat to a starting state and answers with the state that heat leaves: it works in both directions, so the same planner runs a heater
 * and a cooler (freezing and condensing are the same flats walked backwards, with the same sizes). For a heating run from ice or from
 * water it agrees with `planHeating` in `matterdata.js` (held in `tools/lib/mirrowen/q5-crossing.mjs`).
 *
 * THE PARTICLE WINDOW shows twelve molecules, so it can only show a share to the nearest twelfth: while a change of state is under
 * way at least one molecule is drawn on each side of it (a change that has begun shows, one that is not finished shows).
 *
 * THE PHASE DIAGRAM (beyond the AP exam). Water's three lines, from the international standards:
 *   - vapour pressure (liquid–gas): IAPWS-IF97 Region 4 saturation equation, 273.15 K to the critical point;
 *   - sublimation pressure (solid–gas): IAPWS R14-08(2011) eq. 8, to the triple point;
 *   - melting pressure of ice Ih (solid–liquid): IAPWS R14-08(2011) eq. 1, 251.165 K to the triple point.
 * Triple point 273.16 K (0.01 °C), 611.657 Pa. Critical point 647.096 K (373.946 °C), 22.064 MPa. Pressures here are in kPa, T in °C.
 * Rounding: none inside this file; the bench prints its figures to the digits a stage needs.
 */

import { PHASE_WATER } from './matterdata.js';

/* ------------------------------------------------------------------
   THE HEATING CURVE
   ------------------------------------------------------------------ */

/** A starting state for a sample: its temperature and phase (a phase is needed at 0 °C and 100 °C, where two phases share a temperature). */
export function startOf(T, phase, P = PHASE_WATER) {
  if (phase === 'solid') return { T, melted: 0, boiled: 0 };
  if (phase === 'liquid') return { T, melted: 1, boiled: 0 };
  if (phase === 'gas') return { T, melted: 1, boiled: 1 };
  throw new Error(`startOf: no phase "${phase}" (near ${P.Tm} and ${P.Tb} °C)`);
}

/** The lengths of the sample's two flats, in joules: its heat of fusion and its heat of vaporization. */
export function flatsOf(grams, P = PHASE_WATER) {
  const n = grams / P.M;
  return { fus: n * P.fus * 1000, vap: n * P.vap * 1000 };
}

/** The heat, J, of a state above "solid at the melting point with none of it melted". */
export function heatOf(grams, s, P = PHASE_WATER) {
  const { fus, vap } = flatsOf(grams, P);
  const Hb = fus + grams * P.cLiquid * (P.Tb - P.Tm);
  if (s.melted < 1) return s.melted > 0 ? fus * s.melted : grams * P.cSolid * (s.T - P.Tm);
  if (s.boiled < 1) return s.boiled > 0 ? Hb + vap * s.boiled : fus + grams * P.cLiquid * (s.T - P.Tm);
  return Hb + vap + grams * P.cGas * (s.T - P.Tb);
}

/** The state that `h` joules above "solid at the melting point" is. */
export function stateAt(grams, h, P = PHASE_WATER) {
  const { fus, vap } = flatsOf(grams, P);
  const Hb = fus + grams * P.cLiquid * (P.Tb - P.Tm);
  if (h <= 0) return { T: P.Tm + h / (grams * P.cSolid), phase: 'solid', melted: 0, boiled: 0, flat: false };
  if (h < fus) return { T: P.Tm, phase: 'melting', melted: h / fus, boiled: 0, flat: true };
  if (h <= Hb) return { T: P.Tm + (h - fus) / (grams * P.cLiquid), phase: 'liquid', melted: 1, boiled: 0, flat: false };
  if (h < Hb + vap) return { T: P.Tb, phase: 'boiling', melted: 1, boiled: (h - Hb) / vap, flat: true };
  return { T: P.Tb + (h - Hb - vap) / (grams * P.cGas), phase: 'gas', melted: 1, boiled: 1, flat: false };
}

/** What `q` joules (positive in, negative out) do to `grams` of water that starts as `start` (see `startOf`). */
export function planThermal(grams, start, q, P = PHASE_WATER) {
  return stateAt(grams, heatOf(grams, start, P) + q, P);
}

/** The heat, J, that takes a state to another (positive up the curve, negative down it). */
export function heatBetween(grams, a, b, P = PHASE_WATER) {
  return heatOf(grams, b, P) - heatOf(grams, a, P);
}

/**
 * The line a recorder pen draws as the heat runs from `q0` to `q1` joules (either order is walked in the order given), with the corners
 * included: `[{ q, T }]` in joules and °C. `steps` points are spread along the run besides the corners.
 */
export function traceOf(grams, start, q0, q1, steps = 120, P = PHASE_WATER) {
  const h0 = heatOf(grams, start, P);
  const { fus, vap } = flatsOf(grams, P);
  const Hb = fus + grams * P.cLiquid * (P.Tb - P.Tm);
  const lo = Math.min(q0, q1); const hi = Math.max(q0, q1);
  const qs = new Set();
  for (let i = 0; i <= steps; i++) qs.add(lo + ((hi - lo) * i) / steps);
  for (const corner of [0, fus, Hb, Hb + vap]) { const q = corner - h0; if (q > lo && q < hi) qs.add(q); }
  const list = [...qs].sort((a, b) => a - b).map(q => ({ q, T: stateAt(grams, h0 + q, P).T }));
  return q1 >= q0 ? list : list.reverse();
}

/**
 * The window's twelve molecules, as counts: how many are still in the ice (`solid`), how many are loose in the liquid (`liquid`) and how
 * many are flying free (`gas`). A change under way always shows at least one molecule on each side of it.
 */
export function crowdOfTwelve(plan, n = 12) {
  const between = (v, a, b) => Math.max(a, Math.min(b, v));
  const solid = plan.phase === 'melting' ? between(Math.round(n * (1 - plan.melted)), 1, n - 1) : plan.melted >= 1 ? 0 : n;
  const gas = plan.phase === 'boiling' ? between(Math.round(n * plan.boiled), 1, n - 1) : plan.boiled >= 1 ? n : 0;
  return { solid, gas, liquid: n - solid - gas };
}

/** The heat, J, that 1.00 g of a stated state gives a hand on cooling to body temperature (37 °C): the 'burn'. Positive: heat given out. */
export const BODY_T = 37;
export function heatGivenToHand(grams, start, P = PHASE_WATER) {
  return -heatBetween(grams, start, startOf(BODY_T, 'liquid', P), P);
}

/* ------------------------------------------------------------------
   THE PHASE DIAGRAM OF WATER (beyond the AP exam)
   ------------------------------------------------------------------ */

export const WATER_TRIPLE = Object.freeze({ T: 0.01, P: 0.611657 });   // °C, kPa (IAPWS)
export const WATER_CRITICAL = Object.freeze({ T: 373.946, P: 22064 }); // °C, kPa (IAPWS)
const K = 273.15;
const T_T = 273.16;
const P_T = 0.611657; // kPa

/** The vapour pressure of water at `T` °C, kPa: IAPWS-IF97 Region 4 (valid from 0 °C to the critical point). */
export function vapourPressure(T) {
  const n = [0.11670521452767e4, -0.72421316703206e6, -0.17073846940092e2, 0.12020824702470e5, -0.32325550322333e7, 0.14915108613530e2, -0.48232657361591e4, 0.40511340542057e6, -0.23855557567849, 0.65017534844798e3];
  const th = (T + K) + n[8] / ((T + K) - n[9]);
  const A = th * th + n[0] * th + n[1];
  const B = n[2] * th * th + n[3] * th + n[4];
  const C = n[5] * th * th + n[6] * th + n[7];
  return 1000 * (2 * C / (-B + Math.sqrt(B * B - 4 * A * C))) ** 4;
}

/** The sublimation pressure of ice at `T` °C, kPa (T at or below the triple point): IAPWS R14-08 eq. 8. */
export function sublimationPressure(T) {
  const th = (T + K) / T_T;
  const a = [-0.212144006e2, 0.273203819e2, -0.610598130e1];
  const b = [0.333333333e-2, 0.120666667e1, 0.170333333e1];
  const s = a.reduce((acc, ai, i) => acc + ai * th ** b[i], 0);
  return P_T * Math.exp(s / th);
}

/** The pressure at which ice Ih melts at `T` °C, kPa (T from −22 °C to the triple point): IAPWS R14-08 eq. 1. */
export function meltingPressure(T) {
  const th = (T + K) / T_T;
  const a = [0.119539337e7, 0.808183159e5, 0.33382686e4];
  const b = [3, 25.7, 100];
  return P_T * (1 + a.reduce((acc, ai, i) => acc + ai * (1 - th ** b[i]), 0));
}

const bisect = (f, lo, hi) => { let a = lo; let b = hi; for (let i = 0; i < 80; i++) { const m = (a + b) / 2; if (f(m) > 0) b = m; else a = m; } return (a + b) / 2; };

/** The boiling point, °C, at a pressure `P` kPa between the triple point and the critical point. */
export const boilingAt = P => bisect(T => vapourPressure(T) - P, 0.01, WATER_CRITICAL.T);
/** The temperature, °C, at which ice turns directly to vapour at a pressure `P` kPa below the triple point. */
export const sublimingAt = P => bisect(T => sublimationPressure(T) - P, -120, WATER_TRIPLE.T);
/** The melting point of ice, °C, at a pressure `P` kPa (above the triple point, below about 209.9 MPa). Melting pressure falls as T rises. */
export const meltingAt = P => bisect(T => -(meltingPressure(T) - P), -22, WATER_TRIPLE.T);

/** The lowest and highest temperature a sweep runs between, °C. */
export const SWEEP = Object.freeze({ lo: -40, hi: 400 });

/**
 * What heating water at a fixed pressure from `SWEEP.lo` to `SWEEP.hi` goes through: `[{ phase, from, to }]` with `from` and `to` in °C,
 * and the changes between them as `[{ T, from, to }]`. Above the critical pressure there is no boiling, only a liquid that becomes a
 * fluid without a sharp change; below the triple pressure there is no liquid at all.
 */
export function sweepAt(P) {
  const { lo, hi } = SWEEP;
  const changes = [];
  if (P < WATER_TRIPLE.P) {
    changes.push({ T: sublimingAt(P), from: 'solid', to: 'gas' });
  } else {
    changes.push({ T: meltingAt(P), from: 'solid', to: 'liquid' });
    if (P < WATER_CRITICAL.P) changes.push({ T: boilingAt(P), from: 'liquid', to: 'gas' });
  }
  const stages = [];
  let from = lo; let phase = 'solid';
  for (const c of changes) { stages.push({ phase, from, to: c.T }); from = c.T; phase = c.to; }
  // Above the critical pressure the liquid is carried past the critical temperature with no boiling: it becomes a fluid with no sharp change.
  if (P >= WATER_CRITICAL.P) { stages.push({ phase, from, to: WATER_CRITICAL.T }); stages.push({ phase: 'fluid', from: WATER_CRITICAL.T, to: hi }); } else stages.push({ phase, from, to: hi });
  return { P, stages, changes };
}

/** The phase water is in at `T` °C and `P` kPa. Above both critical values it is a supercritical fluid. */
export function phaseAt(T, P) {
  const pastCriticalP = P >= WATER_CRITICAL.P;
  if (P < WATER_TRIPLE.P) return T < sublimingAt(P) ? 'solid' : 'gas';
  if (T < meltingAt(P)) return 'solid';
  if (pastCriticalP) return T >= WATER_CRITICAL.T ? 'fluid' : 'liquid';
  return T < boilingAt(P) ? 'liquid' : 'gas';
}
