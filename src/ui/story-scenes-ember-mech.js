/**
 * story-scenes-ember-mech.js — Ember Reach's story pictures that show a mechanism: heat leaving one body and entering another until they match,
 * heat released in proportion to the amount reacting, bonds broken and formed as a running total, and a gas spreading through the ways it can sit.
 *
 * Same contract as `story-scenes.js`: pure functions of `t` on a 960-wide plate (scaled up by the registry), SCOURED PLATE palette, no glow,
 * every figure read from the bench's own tables in `thermodata.js`. Pure over a 2D context: importable in Node (`verify:story`).
 */

import {
  SPECIFIC_HEATS, SPECIFIC_HEAT_WATER, equilibriumTemp, heatTransfer, FUELS, BOND_ENTHALPIES, bondEnthalpySum, microstateWays
} from '../learn/engine/thermodata.js';
import { C as KIT, disc, line, legacyText as text, ground } from './story-kit.js';
import { win, ease, lerp, hash, crowdOf, placeOf } from './story-sim.js';
const C = { ...KIT, cold: '#6f8fb0', warm: '#c0652b' };

const box = (ctx, x, y, w, h, fill, stroke = C.steel, lw = 1) => {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
};
/** A colour between the bench's cold and warm for a temperature in [lo, hi]. */
function heatColour(T, lo, hi) {
  const f = Math.max(0, Math.min(1, (T - lo) / (hi - lo)));
  const a = [0x6f, 0x8f, 0xb0]; const b = [0xc0, 0x65, 0x2b];
  return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], f))).join(',')})`;
}

/* ---- q2-calorimetry: a hot block goes into cool water; what the block loses the water gains, and both settle on one temperature ---- */
const BLOCK = { m: 50, c: SPECIFIC_HEATS.aluminum.c, T: 100 };
const WATER = { m: 100, c: SPECIFIC_HEAT_WATER, T: 20 };
const T_FINAL = equilibriumTemp(BLOCK.m, BLOCK.c, BLOCK.T, WATER.m, WATER.c, WATER.T);
const Q_BLOCK = heatTransfer(BLOCK.m, BLOCK.c, T_FINAL - BLOCK.T);
const Q_WATER = heatTransfer(WATER.m, WATER.c, T_FINAL - WATER.T);

function heatSwap(ctx, w, h, t) {
  ground(ctx, w, h);
  const s = win(t, 0.28, 0.62);
  const decay = Math.exp(-4.5 * s);
  const Tb = T_FINAL + (BLOCK.T - T_FINAL) * decay;
  const Tw = T_FINAL - (T_FINAL - WATER.T) * decay;
  const drop = ease(win(t, 0.2, 0.3));
  // The beaker, the water and the block.
  const bx = 70; const by = 230; const bw = 270; const bh = 210;
  box(ctx, bx, by, bw, bh, '#100f0c', C.steel, 2);
  const level = by + 60;
  ctx.fillStyle = heatColour(Tw, 15, 100);
  ctx.globalAlpha = 0.65;
  ctx.fillRect(bx + 3, level, bw - 6, bh - 63);
  ctx.globalAlpha = 1;
  const blockY = lerp(110, by + bh - 90, drop);
  box(ctx, bx + bw / 2 - 45, blockY, 90, 70, heatColour(Tb, 15, 100), C.dust, 2);
  text(ctx, 'metal', bx + bw / 2, blockY + 35, { size: 20, color: '#16140f', weight: 700 });
  text(ctx, `${BLOCK.m} g`, bx + 40, 100, { size: 20, color: C.dust });
  text(ctx, `${WATER.m} g water`, bx + bw / 2, by + bh + 28, { size: 20, color: C.dust });
  // Heat leaving the block and entering the water: dots streaming out, as many as the temperature gap still holds.
  const gap = Tb - Tw;
  if (s > 0 && s < 1) {
    const n = Math.round(14 * (gap / (BLOCK.T - WATER.T)));
    for (let i = 0; i < n; i++) {
      const u = (i / Math.max(1, n) + s * 3) % 1;
      const ang = hash(i, 4) * Math.PI;
      disc(ctx, bx + bw / 2 + Math.cos(ang) * (50 + 100 * u), blockY + 35 + Math.sin(ang) * (30 + 70 * u) * 0.8, 4, C.amber);
    }
  }
  // The two temperatures against time: they approach each other and meet.
  const gx = 430; const gy = 110; const gw = 440; const gh = 260;
  const Y = T => gy + gh - ((T - 10) / 100) * gh;
  line(ctx, gx, gy, gx, gy + gh, C.steel, 2);
  line(ctx, gx, gy + gh, gx + gw, gy + gh, C.steel, 2);
  text(ctx, '°C', gx - 6, gy - 14, { size: 18, color: C.dim, align: 'right' });
  text(ctx, 'time', gx + gw, gy + gh + 28, { size: 18, color: C.dim, align: 'right' });
  const curve = (f, color) => {
    ctx.beginPath();
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const u = (i / steps) * s;
      const x = gx + (u / 1) * gw * 0.9; const y = Y(f(u));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
  };
  if (s > 0) {
    curve(u => T_FINAL + (BLOCK.T - T_FINAL) * Math.exp(-4.5 * u), C.warm);
    curve(u => T_FINAL - (T_FINAL - WATER.T) * Math.exp(-4.5 * u), C.cold);
  }
  text(ctx, `${Math.round(Tb)}`, gx - 12, Y(Tb), { size: 20, color: C.warm, align: 'right', weight: 700 });
  text(ctx, `${Math.round(Tw)}`, gx - 12, Y(Tw) + 18, { size: 20, color: C.cold, align: 'right', weight: 700 });
  if (s >= 1) {
    line(ctx, gx, Y(T_FINAL), gx + gw, Y(T_FINAL), C.amber, 1, [6, 6]);
    text(ctx, `${T_FINAL.toFixed(1)} °C`, gx + gw, Y(T_FINAL) - 14, { size: 24, color: C.amber, align: 'right', weight: 700 });
  }
  // Each side's heat, from q = m × c × ΔT, drawn as bars of equal length.
  const bars = ease(win(t, 0.66, 0.84));
  if (bars > 0) {
    const bw2 = 150 * (Math.abs(Q_BLOCK) / 3400) * bars;
    ctx.globalAlpha = bars;
    text(ctx, `${BLOCK.m} × ${BLOCK.c} × ${(BLOCK.T - T_FINAL).toFixed(1)}`, gx, 420, { size: 18, color: C.dust, align: 'left' });
    ctx.fillStyle = C.warm; ctx.fillRect(gx + 200, 408, bw2, 18);
    text(ctx, `${WATER.m} × ${WATER.c} × ${(T_FINAL - WATER.T).toFixed(1)}`, gx, 460, { size: 18, color: C.dust, align: 'left' });
    ctx.fillStyle = C.cold; ctx.fillRect(gx + 200, 448, 150 * (Math.abs(Q_WATER) / 3400) * bars, 18);
    text(ctx, `lost ${Math.round(-Q_BLOCK)} J`, gx + 200 + bw2 + 12, 417, { size: 18, color: C.text, align: 'left' });
    text(ctx, `gained ${Math.round(Q_WATER)} J`, gx + 200 + 150 * (Math.abs(Q_WATER) / 3400) * bars + 12, 457, { size: 18, color: C.text, align: 'left' });
    ctx.globalAlpha = 1;
  }
  if (t < 0.25) { text(ctx, `${BLOCK.T} °C`, bx + bw / 2 + 80, 140, { size: 24, color: C.warm, weight: 700 }); text(ctx, `${WATER.T} °C`, bx + bw - 40, by + 40, { size: 24, color: C.cold, weight: 700 }); }
}

/* ---- q3-enthalpy: heat given out grows with the amount reacting; per mole one fuel leads, per gram another ---- */
const FUEL_ORDER = ['hydrogen', 'methane', 'methanol', 'carbon'];
function fuelBars(ctx, w, h, t) {
  ground(ctx, w, h);
  const one = FUELS.hydrogen;
  const phase1 = 1 - ease(win(t, 0.28, 0.34));
  if (phase1 > 0) {
    ctx.globalAlpha = phase1;
    // Heat against moles: a straight line, because twice the amount gives twice the heat.
    const gx = 130; const gy = 110; const gw = 700; const gh = 300;
    line(ctx, gx, gy, gx, gy + gh, C.steel, 2);
    line(ctx, gx, gy + gh, gx + gw, gy + gh, C.steel, 2);
    text(ctx, 'heat given out (kJ)', gx + 6, gy - 20, { size: 20, color: C.dim, align: 'left' });
    text(ctx, 'moles burned', gx + gw, gy + gh + 34, { size: 20, color: C.dim, align: 'right' });
    const maxN = 0.4; const maxQ = maxN * Math.abs(one.dHc);
    const X = n => gx + (n / maxN) * gw; const Y = q => gy + gh - (q / maxQ) * gh;
    const grow = ease(win(t, 0.04, 0.24));
    line(ctx, X(0), Y(0), X(maxN * grow), Y(maxQ * grow), C.text, 2);
    [0.1, 0.2, 0.3].forEach((n, i) => {
      const a = ease(win(t, 0.08 + i * 0.05, 0.16 + i * 0.05));
      if (a <= 0) return;
      ctx.globalAlpha = phase1 * a;
      const q = n * Math.abs(one.dHc);
      line(ctx, X(n), Y(0), X(n), Y(q), C.amber, 6);
      disc(ctx, X(n), Y(q), 8, C.amber);
      text(ctx, `${q.toFixed(1)}`, X(n), Y(q) - 22, { size: 22, color: C.text, weight: 700 });
      text(ctx, `${n}`, X(n), Y(0) + 24, { size: 18, color: C.dust });
    });
    ctx.globalAlpha = 1;
  }
  const phase2 = ease(win(t, 0.32, 0.4));
  if (phase2 > 0) {
    // The same four fuels twice: for one mole of each, then for one gram of each. The bars slide to their new places as the measure changes.
    const m = ease(win(t, 0.62, 0.8));
    const mole = FUEL_ORDER.map(k => Math.abs(FUELS[k].dHc));
    const gram = FUEL_ORDER.map(k => FUELS[k].kJPerGram);
    const rank = arr => arr.map(v => arr.filter(o => o > v).length);
    const rM = rank(mole); const rG = rank(gram);
    const grow = ease(win(t, 0.38, 0.55));
    const gx = 110; const base = 410; const maxH = 260;
    ctx.globalAlpha = phase2;
    line(ctx, gx - 20, base, 860, base, C.steel, 2);
    FUEL_ORDER.forEach((k, i) => {
      const slot = lerp(rM[i], rG[i], m);
      const x = gx + slot * 185;
      const v = lerp(mole[i], gram[i], m);
      const vmax = lerp(Math.max(...mole), Math.max(...gram), m);
      const bh = (v / vmax) * maxH * grow;
      ctx.fillStyle = m > 0.5 ? C.amber : C.pale;
      ctx.fillRect(x, base - bh, 110, bh);
      text(ctx, FUELS[k].formula, x + 55, base + 28, { size: 24, color: C.text, weight: 700 });
      text(ctx, `${v >= 100 ? Math.round(v) : v.toFixed(1)}`, x + 55, base - bh - 18, { size: 22, color: C.text, weight: 700 });
    });
    text(ctx, m < 0.5 ? 'heat from one mole of each (kJ)' : 'heat from one gram of each (kJ)', w / 2, 80, { size: 26, color: m < 0.5 ? C.dust : C.amber });
    ctx.globalAlpha = 1;
  }
}

/* ---- q4-bonds: break the old bonds (energy in), form the new ones (energy out); what is left over is the heat of the reaction ---- */
function bondLedger(ctx, w, h, t) {
  ground(ctx, w, h);
  const hh = BOND_ENTHALPIES['H-H'].dH; const cc = BOND_ENTHALPIES['Cl-Cl'].dH; const hc = BOND_ENTHALPIES['H-Cl'].dH;
  const net = bondEnthalpySum([{ bond: 'H-H', count: 1 }, { bond: 'Cl-Cl', count: 1 }], [{ bond: 'H-Cl', count: 2 }]);
  const zero = 250; const k = 0.27;
  const steps = [
    { v: hh, a: 0.06, b: 0.2, label: `H–H breaks  +${hh}`, col: C.warm },
    { v: cc, a: 0.22, b: 0.36, label: `Cl–Cl breaks  +${cc}`, col: C.warm },
    { v: -hc, a: 0.46, b: 0.6, label: `H–Cl forms  −${hc}`, col: C.cold },
    { v: -hc, a: 0.62, b: 0.76, label: `H–Cl forms  −${hc}`, col: C.cold }
  ];
  line(ctx, 60, zero, 900, zero, C.dim, 1, [5, 5]);
  text(ctx, '0', 48, zero, { size: 18, color: C.dim, align: 'right' });
  let level = 0;
  steps.forEach((s, i) => {
    const g = ease(win(t, s.a, s.b));
    const x = 90 + i * 150;
    const y0 = zero - level * k; const y1 = zero - (level + s.v * g) * k;
    ctx.fillStyle = s.col;
    ctx.fillRect(x, Math.min(y0, y1), 110, Math.abs(y1 - y0));
    if (g > 0.9) text(ctx, s.label, x + 55, s.v > 0 ? Math.min(y0, y1) - 18 : Math.max(y0, y1) + 22, { size: 16, color: C.text });
    if (i < 3 && g > 0.5) line(ctx, x + 110, y1, x + 150, y1, C.dim, 1);
    level += s.v * g;
  });
  // The running total, as a marker at the level reached.
  const markY = zero - level * k;
  line(ctx, 60, markY, 720, markY, C.amber, 1, [3, 5]);
  text(ctx, `${Math.round(level) >= 0 ? '+' : '−'}${Math.abs(Math.round(level))}`, 740, markY, { size: 28, color: C.amber, align: 'left', weight: 700 });
  text(ctx, 'kJ so far', 740, markY + 28, { size: 16, color: C.dim, align: 'left' });
  // The molecules at each stage, so the sums are of something: H₂ + Cl₂, then four separate atoms, then two HCl.
  const iconY = 478;
  const r = (x, y, rad, fill) => disc(ctx, x, y, rad, fill, C.steel);
  const stage = t < 0.2 ? 0 : t < 0.44 ? 1 : 2;
  if (stage === 0) { r(190, iconY, 14, C.pale); r(222, iconY, 14, C.pale); line(ctx, 190, iconY, 222, iconY, C.text, 3); r(320, iconY, 22, '#5b7a32'); r(370, iconY, 22, '#5b7a32'); line(ctx, 320, iconY, 370, iconY, C.text, 3); }
  if (stage === 1) { [180, 230].forEach(x => r(x, iconY, 14, C.pale)); [320, 380].forEach(x => r(x, iconY, 22, '#5b7a32')); }
  if (stage === 2) { [[190, 230], [330, 370]].forEach(([a, b], i) => { r(a, iconY, 22, '#5b7a32'); r(b, iconY, 14, C.pale); line(ctx, a, iconY, b, iconY, C.text, 3); }); }
  text(ctx, stage === 0 ? 'H₂ + Cl₂' : stage === 1 ? 'four separate atoms' : '2 HCl', 540, iconY, { size: 24, color: C.dust, align: 'left' });
  if (t > 0.8) {
    const a = ease(win(t, 0.8, 0.92));
    ctx.globalAlpha = a;
    text(ctx, `+${hh + cc} in, −${2 * hc} out: ${net} kJ`, w / 2, 70, { size: 30, color: C.amber, weight: 700 });
    ctx.globalAlpha = 1;
  }
}

/* ---- q6-entropy: with the partition out, a gas spreads because there are far more ways to be spread than to stay in one half ---- */
const SPREAD = crowdOf(8, 61, 0.4);
function spreadCount(ctx, w, h, t) {
  ground(ctx, w, h);
  const open = ease(win(t, 0.18, 0.4));
  const bx = 60; const by = 140; const bw = 380; const bh = 260;
  box(ctx, bx, by, bw, bh, '#100f0c', C.steel, 2);
  const reach = lerp(0.5, 1, open);
  let left = 0;
  SPREAD.forEach(p => {
    const [u, v] = placeOf(p, t * 11);
    const x = u * reach;
    if (x < 0.5) left++;
    disc(ctx, bx + 12 + x * (bw - 24), by + 12 + v * (bh - 24), 9, x < 0.5 ? C.pale : C.amber);
  });
  // The partition lifts away.
  const lift = open;
  ctx.fillStyle = C.iron;
  ctx.fillRect(bx + bw / 2 - 3, by - lift * 50, 6, bh);
  text(ctx, t < 0.18 ? 'all 8 in the left half' : `${left} left, ${8 - left} right`, bx + bw / 2, by + bh + 36, { size: 24, color: C.text });
  // How many ways each split can happen: the middle splits are the many, "all on one side" is one.
  const ways = Array.from({ length: 9 }, (_, i) => microstateWays(8, i));
  const total = ways.reduce((a, b) => a + b, 0);
  const hx = 520; const hy = 400; const hw = 380; const hh = 220;
  const show = ease(win(t, 0.4, 0.58));
  ctx.globalAlpha = show;
  line(ctx, hx, hy, hx + hw, hy, C.steel, 2);
  ways.forEach((n, i) => {
    const k = 8 - i; // particles in the left half, from 8 down to 0
    const x = hx + i * (hw / 9) + 4;
    const bh2 = (n / 70) * hh * show;
    const live = k === left;
    ctx.fillStyle = live ? C.amber : C.steel;
    ctx.fillRect(x, hy - bh2, hw / 9 - 8, bh2);
    text(ctx, `${k}`, x + (hw / 9 - 8) / 2, hy + 22, { size: 16, color: live ? C.amber : C.dim });
    if (n >= 8) text(ctx, `${n}`, x + (hw / 9 - 8) / 2, hy - bh2 - 14, { size: 16, color: live ? C.amber : C.dust });
  });
  text(ctx, 'particles in the left half', hx + hw / 2, hy + 52, { size: 18, color: C.dim });
  text(ctx, 'ways to arrange them', hx, hy - hh - 30, { size: 20, color: C.dust, align: 'left' });
  ctx.globalAlpha = 1;
  if (t > 0.76) text(ctx, `all 8 back in one half: 1 way in ${total}`, w / 2, 70, { size: 28, color: C.amber, weight: 700 });
}

export const EMBER_MECHANISMS = {
  'heat-swap': heatSwap,
  'fuel-bars': fuelBars,
  'bond-ledger': bondLedger,
  'spread-count': spreadCount
};
