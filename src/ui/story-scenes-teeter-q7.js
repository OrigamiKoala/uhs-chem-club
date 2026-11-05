/**
 * story-scenes-teeter-q7.js — the story painter of Teeter's bench 7 (`q7-dissolve`), spread into `TEETER_SCENES` (`story-scenes-teeter.js`).
 * A 960-wide plate, a pure function of `t`; every number printed is measured from what is drawn (a bar's height or length in pixels, the
 * events of a drawn run), using the planners the bench reads (`engine/eqdata.js`: `dissolveState`, `solubilityWithCommon`, `simulatePan`).
 *
 * `solubility-trade`, four beats:
 *   0 to 0.26     six scoops of CaF2 go in; the bar of [Ca²⁺] after each scoop is read from its height, and it stops growing once solid stays.
 *   0.26 to 0.50  24 units at the surface of the solid are run (`simulatePan`): the units that left and the units that came back are counted
 *                 from the drawn run, tick by tick.
 *   0.50 to 0.76  AgCl in water and in 0.10 mol/L chloride: two bars on a scale where each step is ten times the last; the figure is read
 *                 from the bar's length.
 *   0.76 to 1     AgCl and Ag2CrO4: bars of what is dissolved, read from their heights, with each salt's Ksp written under its bar.
 */

import { KSP, molarSolubility, dissolveState, solubilityWithCommon, simulatePan, rng } from '../learn/engine/eqdata.js';
import { C, text, ground, win, ease } from './story-kit.js';

const CAT = '#c0652b'; const AN = '#6f8fb0'; const SOLID = '#cfc8b8';
const fs = h => Math.max(14, h * 0.042);
const SCOOP = 1 / 3.5;

/** 1.3e−5 as the bench prints it. */
function fmt(x) {
  if (!(x > 0)) return '0';
  let e = Math.floor(Math.log10(x) + 1e-12);
  let ms = (x / Math.pow(10, e) + 1e-9).toFixed(1);
  if (parseFloat(ms) >= 10) { ms = '1.0'; e += 1; }
  return `${ms}e${e < 0 ? '−' : ''}${Math.abs(e)}`;
}

function box(ctx, x, y, w, h) {
  ctx.fillStyle = '#100f0c'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.steel; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

const CAF2 = KSP.CaF2;
const S_CAF2 = molarSolubility(CAF2.ksp, CAF2.ions);
const SURFACE = simulatePan({ n: 24, b0: 6, kf: 0.05, kr: 0.15, ticks: 100, seed: 7 });
const S_AGCL = molarSolubility(KSP.AgCl.ksp, KSP.AgCl.ions);
const S_AGCL_CL = solubilityWithCommon(KSP.AgCl.ksp, KSP.AgCl.ions, 'anion', 0.10);
const S_AG2 = molarSolubility(KSP.Ag2CrO4.ksp, KSP.Ag2CrO4.ions);

/** Beat one: the bar of [Ca²⁺] after each of six scoops. */
function scoops(ctx, w, h, p) {
  const bw = w * 0.07; const gap = w * 0.035; const x0 = w * 0.14; const y1 = h * 0.64; const H = h * 0.4;
  const vmax = 1.15 * S_CAF2;
  text(ctx, 'CaF₂ added a scoop at a time', w * 0.5, h * 0.1, { size: fs(h), color: C.dust });
  box(ctx, x0 - gap, y1 - H - 6, 6 * (bw + gap) + gap, H + 12);
  const shown = Math.min(6, Math.floor(ease(p) * 6.999) + 1);
  let last = 0; let prev = 0;
  for (let i = 1; i <= 6; i++) {
    const st = dissolveState(CAF2.ksp, CAF2.ions, i * SCOOP * S_CAF2);
    const barH = (st.cat / (CAF2.ions[0] * vmax)) * H;
    const x = x0 + (i - 1) * (bw + gap);
    if (i <= shown) {
      ctx.fillStyle = CAT; ctx.fillRect(x, y1 - barH, bw, barH);
      if (st.solid > 0) { ctx.fillStyle = SOLID; ctx.fillRect(x, y1 + 8, bw, Math.min(26, 8 + (st.solid / S_CAF2) * 30)); }
      text(ctx, String(i), x + bw / 2, y1 + 48, { size: fs(h) * 0.9, color: C.dim });
    }
    if (i === shown) { prev = i > 1 ? (dissolveState(CAF2.ksp, CAF2.ions, (i - 1) * SCOOP * S_CAF2).cat / (CAF2.ions[0] * vmax)) * H : 0; last = barH; }
  }
  const read = (last / H) * vmax * CAF2.ions[0];
  text(ctx, `[Ca²⁺] after scoop ${shown}: ${fmt(read)} mol/L`, w * 0.5, h * 0.84, { size: fs(h) * 1.1, color: C.amber, weight: 700 });
  text(ctx, Math.abs(last - prev) < 0.5 && shown > 1 ? 'this scoop changed the bar by 0 px; solid lies on the floor' : 'bar read from its height', w * 0.5, h * 0.92, { size: fs(h), color: C.dim });
  // The right half: the beaker's floor, a square of solid for each scoop's worth that is left over.
  const st = dissolveState(CAF2.ksp, CAF2.ions, shown * SCOOP * S_CAF2);
  const fx = w * 0.72; const fw = w * 0.2;
  ctx.strokeStyle = C.steel; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(fx, h * 0.22); ctx.lineTo(fx, h * 0.62); ctx.lineTo(fx + fw, h * 0.62); ctx.lineTo(fx + fw, h * 0.22); ctx.stroke(); ctx.lineWidth = 1;
  ctx.fillStyle = '#1b2227'; ctx.fillRect(fx + 2, h * 0.28, fw - 4, h * 0.34 - 2);
  const n = st.solid > 0 ? Math.max(1, Math.round((st.solid / S_CAF2) * 6)) : 0;
  const sq = w * 0.018;
  for (let k = 0; k < n; k++) { ctx.fillStyle = SOLID; ctx.fillRect(fx + 10 + k * (sq + 3), h * 0.62 - sq - 4, sq, sq); }
  text(ctx, n ? `${n} squares of solid on the floor` : 'no solid on the floor', fx + fw / 2, h * 0.68, { size: fs(h), color: C.dust });
}

/** Beat two: 24 surface units, the units that left and the units that came back counted from the drawn run. */
function trade(ctx, w, h, p) {
  const k = 50 + Math.round(ease(p) * 50);
  text(ctx, 'units at the surface of the solid, counted over the run', w * 0.5, h * 0.1, { size: fs(h), color: C.dust });
  const dx = w * 0.08; const dy = h * 0.2; const dw = w * 0.36; const dh = h * 0.42;
  box(ctx, dx, dy, dw, dh);
  const cols = 6; const rows = 4; const cw = dw / cols; const ch = dh / rows;
  for (let i = 0; i < 24; i++) {
    const g = rng(i * 7919 + k * 104729 + 3);
    const cx = dx + ((i % cols) + 0.5) * cw + (g() - 0.5) * cw * 0.3;
    const cy = dy + (Math.floor(i / cols) + 0.5) * ch + (g() - 0.5) * ch * 0.3;
    const away = SURFACE.states[k * 24 + i];
    ctx.fillStyle = away ? CAT : SOLID;
    if (away) { ctx.beginPath(); ctx.arc(cx, cy, Math.min(cw, ch) * 0.26, 0, Math.PI * 2); ctx.fill(); } else ctx.fillRect(cx - cw * 0.2, cy - ch * 0.2, cw * 0.4, ch * 0.4);
  }
  let f = 0; let v = 0;
  for (let i = 51; i <= k; i++) { f += SURFACE.fwd[i]; v += SURFACE.rev[i]; }
  text(ctx, `left the solid: ${f}`, w * 0.68, h * 0.34, { size: fs(h) * 1.25, color: CAT, weight: 700 });
  text(ctx, `came back: ${v}`, w * 0.68, h * 0.46, { size: fs(h) * 1.25, color: AN, weight: 700 });
  text(ctx, 'counted since tick 50', w * 0.68, h * 0.56, { size: fs(h), color: C.dim });
  text(ctx, `units away now: ${SURFACE.b[k]} of 24`, w * 0.26, h * 0.7, { size: fs(h), color: C.dust });
}

/** A bar on a scale where each step is ten times the last; the figure is read back from the bar's length. */
function logBar(ctx, x, y, w, h, value, ink, p, label) {
  const lo = -11; const hi = -4;
  const len = ease(p) * ((Math.log10(value) - lo) / (hi - lo)) * w;
  box(ctx, x, y, w, h);
  ctx.fillStyle = ink; ctx.fillRect(x, y, len, h);
  const read = Math.pow(10, lo + (len / w) * (hi - lo));
  text(ctx, label, x, y - h * 0.5, { size: h * 0.62, color: C.dust, align: 'left' });
  if (p > 0.98) text(ctx, `${fmt(read)} mol/L`, x + len + 14, y + h / 2, { size: h * 0.7, color: C.amber, weight: 700, align: 'left' });
}

/** Beat three: the same salt in water and with a common ion. */
function common(ctx, w, h, p) {
  text(ctx, 'AgCl in water, and with chloride already in the water', w * 0.5, h * 0.1, { size: fs(h), color: C.dust });
  const bx = w * 0.1; const bw = w * 0.62; const bh = h * 0.1;
  logBar(ctx, bx, h * 0.32, bw, bh, S_AGCL, AN, win(p, 0, 0.5), 'pure water');
  logBar(ctx, bx, h * 0.58, bw, bh, S_AGCL_CL, CAT, win(p, 0.5, 1), '0.10 mol/L chloride added');
  text(ctx, 'each step along the scale is ten times the one before', w * 0.5, h * 0.88, { size: fs(h), color: C.dim });
}

/** Beat four: two salts, the amount of each that is dissolved read from the bar's height, the Ksp written under it. */
function rank(ctx, w, h, p) {
  text(ctx, 'dissolved in water, mol/L', w * 0.5, h * 0.1, { size: fs(h), color: C.dust });
  const vmax = 7.5e-5; const H = h * 0.5; const y1 = h * 0.7; const bw = w * 0.16;
  [[KSP.AgCl, S_AGCL, 0.3, AN], [KSP.Ag2CrO4, S_AG2, 0.62, CAT]].forEach(([S, s, fx, ink], i) => {
    const q = win(p, i * 0.4, i * 0.4 + 0.5);
    const barH = ease(q) * (s / vmax) * H;
    ctx.fillStyle = ink; ctx.fillRect(w * fx, y1 - barH, bw, barH);
    box(ctx, w * fx - 1, y1 - H - 1, bw + 2, H + 2);
    ctx.fillStyle = ink; ctx.fillRect(w * fx, y1 - barH, bw, barH);
    const read = (barH / H) * vmax;
    if (q > 0.98) text(ctx, fmt(read), w * fx + bw / 2, y1 - barH - 20, { size: fs(h) * 1.2, color: C.amber, weight: 700 });
    text(ctx, S.formula, w * fx + bw / 2, y1 + 28, { size: fs(h) * 1.1, color: C.dust, weight: 700 });
    text(ctx, `Ksp ${fmt(S.ksp)}`, w * fx + bw / 2, y1 + 58, { size: fs(h), color: C.dim });
  });
}

function solubilityTrade(ctx, w, h, t) {
  ground(ctx, w, h);
  if (t <= 0.26) scoops(ctx, w, h, win(t, 0, 0.26));
  else if (t <= 0.5) trade(ctx, w, h, win(t, 0.26, 0.5));
  else if (t <= 0.76) common(ctx, w, h, win(t, 0.5, 0.76));
  else rank(ctx, w, h, win(t, 0.76, 1));
}

export const TEETER_Q7_SCENES = {
  'solubility-trade': solubilityTrade
};
