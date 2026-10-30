/**
 * story-scenes-mirrowen-q4.js — the story picture of Mirrowen's q4 bench ("Kinds of Solid"): what melting does to a molecular solid, why
 * quartz and glass give way differently, and why.
 *
 * Same contract as `story-scenes-mirrowen.js`: a pure function of `t` on a 960-wide plate, SCOURED PLATE palette, no glow. Every figure is
 * read from `matterdata-tester.js`: the temperature that melts each solid, the rigidity trace of each (`stiffness`), and the angles at
 * every silicon, measured from the very picture on screen (`bondAngles`). Pure over a 2D context: importable in Node (`verify:story`).
 */

import { SOLIDS, arrangementOf, stiffness, bondAngles, fmtT } from '../learn/engine/matterdata-tester.js';
import { C, disc, line, legacyText as text, ground } from './story-kit.js';
import { win, ease, lerp, hash } from './story-sim.js';

const INK = { Si: '#8d99a6', O: '#9a4a2e', I: '#6a5a7a', cation: '#b4ab97' };

/** Draw a picture's bonds and atoms at (ox, oy), `k` pixels to a picture unit; `jit` shakes every atom a little. */
function net(ctx, arr, ox, oy, k, { jit = 0, clock = 0, alpha = 1, place = null } = {}) {
  const at = arr.atoms.map((a, i) => {
    const p = place ? place(a, i) : { x: a.x, y: a.y };
    return { x: ox + (p.x + Math.sin(clock * 5 + i * 1.7) * jit) * k, y: oy + (p.y + Math.cos(clock * 4.3 + i * 2.3) * jit) * k };
  });
  ctx.globalAlpha = alpha;
  for (const [i, j] of arr.bonds) line(ctx, at[i].x, at[i].y, at[j].x, at[j].y, C.dust, Math.max(1.5, k * 0.16));
  arr.atoms.forEach((a, i) => disc(ctx, at[i].x, at[i].y, Math.max(2.5, a.r * k), INK[a.k] || C.dust, C.bg));
  ctx.globalAlpha = 1;
  return at;
}

/** The melting temperatures of the three molecular solids the bench heated, from the table. */
const MOLECULAR = ['ice', 'naphthalene', 'iodine'].map(id => SOLIDS[id]);
const IODINE = SOLIDS.iodine;

/** Part one: iodine heated to its melting temperature. The molecules loosen and stay whole; the count is of the drawn molecules. */
function molecularMelt(ctx, t, clock) {
  const arr = arrangementOf(IODINE.picture);
  const grow = ease(win(t, 0.02, 0.26));
  const T = lerp(25, IODINE.melt.lo + 6, grow);
  const loose = ease(win(T, IODINE.melt.lo - 2, IODINE.melt.lo + 3));
  const k = 14.5; const ox = 70; const oy = 110;
  ctx.strokeStyle = C.steel; ctx.lineWidth = 2; ctx.strokeRect(ox - 8, oy - 8, 32 * k + 16, 18 * k + 16);
  // Each molecule is a pair of atoms: it moves as one, so the bond inside it keeps its length.
  const mol = new Map();
  arr.bonds.forEach(([i, j], m) => { mol.set(i, m); mol.set(j, m); });
  const place = (a, i) => {
    const m = mol.get(i);
    const dx = (hash(m, 1) - 0.5) * 4.4 * loose; const dy = (hash(m, 2) - 0.5) * 3.6 * loose;
    const turn = (hash(m, 3) - 0.5) * 2.4 * loose;
    const [pi, pj] = arr.bonds[m];
    const cx = (arr.atoms[pi].x + arr.atoms[pj].x) / 2; const cy = (arr.atoms[pi].y + arr.atoms[pj].y) / 2;
    const rx = a.x - cx; const ry = a.y - cy;
    return { x: cx + dx + rx * Math.cos(turn) - ry * Math.sin(turn), y: cy + dy + rx * Math.sin(turn) + ry * Math.cos(turn) };
  };
  net(ctx, arr, ox, oy, k, { jit: 0.05 + 0.12 * Math.min(1, T / IODINE.melt.lo), clock, place });
  // Counted from what is laid out: a molecule is whole when its two atoms are still as far apart as they were.
  const laid = arr.atoms.map(place);
  let whole = 0;
  arr.bonds.forEach(([i, j]) => {
    const d0 = Math.hypot(arr.atoms[i].x - arr.atoms[j].x, arr.atoms[i].y - arr.atoms[j].y);
    const d1 = Math.hypot(laid[i].x - laid[j].x, laid[i].y - laid[j].y);
    if (Math.abs(d1 - d0) < 1e-6) whole++;
  });
  text(ctx, 'iodine', ox + 16, 82, { size: 26, color: C.text, weight: 700, align: 'left' });
  text(ctx, `${fmtT(T)} °C`, ox + 32 * k, 82, { size: 28, color: C.amber, weight: 700, align: 'right' });
  text(ctx, `${whole} of ${arr.bonds.length} molecules whole`, ox + 16 * k, oy + 18 * k + 40, { size: 24, color: C.text });
  // The axis the three molecular solids melt on.
  const ax0 = 640; const ax1 = 910; const ay = 220;
  line(ctx, ax0, ay, ax1, ay, C.steel, 2);
  const X = v => lerp(ax0, ax1, v / 130);
  [0, 50, 100].forEach(v => { line(ctx, X(v), ay, X(v), ay + 10, C.steel, 2); text(ctx, String(v), X(v), ay + 28, { size: 20, color: C.dust }); });
  text(ctx, 'melts at (°C)', (ax0 + ax1) / 2, ay + 62, { size: 22, color: C.dust });
  MOLECULAR.forEach((s, i) => {
    const on = ease(win(t, 0.1 + i * 0.05, 0.22 + i * 0.05));
    ctx.globalAlpha = on;
    disc(ctx, X(s.melt.lo), ay - 26 - (i % 2) * 34, 10, C.amber, C.bg);
    text(ctx, s.name, X(s.melt.lo), ay - 62 - (i % 2) * 34, { size: 20, color: C.text });
    ctx.globalAlpha = 1;
  });
  line(ctx, X(T), ay - 8, X(T), ay + 8, C.text, 3);
}

/** Part two: quartz and fused silica heated together. Each trace is drawn from `stiffness`, and each picture shakes as it loses stiffness. */
function twoSilicas(ctx, t, clock, a) {
  const p = ease(win(t, 0.36, 0.68));
  const T = lerp(0, 2000, p);
  const k = 12.6;
  ctx.globalAlpha = a;
  text(ctx, `${fmtT(T)} °C`, 480, 40, { size: 32, color: C.amber, weight: 700 });
  [['quartz', 50], ['silica', 506]].forEach(([id, ox]) => {
    const s = SOLIDS[id];
    const arr = arrangementOf(s.picture);
    const st = stiffness(s, T);
    ctx.strokeStyle = C.steel; ctx.lineWidth = 2; ctx.strokeRect(ox - 6, 84, 32 * k * 0.9 + 12, 18 * k * 0.9 + 12);
    net(ctx, arr, ox, 90, k * 0.9, { jit: 0.04 + 0.5 * (1 - st), clock, alpha: 0.45 + 0.55 * st });
    text(ctx, s.name, ox, 70, { size: 24, color: C.text, weight: 700, align: 'left' });
    // The trace of this solid up to now, from the same function the tester draws.
    const px = ox; const pw = 32 * k * 0.9; const py0 = 350; const ph = 130;
    line(ctx, px, py0, px, py0 + ph, C.steel, 2); line(ctx, px, py0 + ph, px + pw, py0 + ph, C.steel, 2);
    ctx.strokeStyle = C.amber; ctx.lineWidth = 3; ctx.beginPath();
    const n = 120;
    for (let i = 0; i <= n; i++) {
      const Ti = (2000 * i) / n;
      if (Ti > T) break;
      const x = px + (Ti / 2000) * pw; const y = py0 + ph - stiffness(s, Ti) * (ph - 8) - 4;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.stroke();
    text(ctx, 'rigid', px + 8, py0 + 14, { size: 18, color: C.dim, align: 'left' });
    text(ctx, '2000 °C', px + pw, py0 + ph + 22, { size: 18, color: C.dim, align: 'right' });
    text(ctx, '0', px, py0 + ph + 22, { size: 18, color: C.dim, align: 'left' });
  });
  ctx.globalAlpha = 1;
  void clock;
}

/** The angles at every silicon, in bins of ten degrees, counted from the drawn picture. */
function histogram(ctx, arr, x0, y0, w, h, label) {
  const angles = bondAngles(arr);
  const bins = new Array(12).fill(0);
  angles.forEach(a => { bins[Math.max(0, Math.min(11, Math.floor((a - 60) / 10)))]++; });
  const peak = Math.max(1, ...bins);
  line(ctx, x0, y0 + h, x0 + w, y0 + h, C.steel, 2);
  bins.forEach((n, i) => {
    const bh = (n / peak) * (h - 14);
    ctx.fillStyle = C.amber; ctx.fillRect(x0 + (i / 12) * w + 3, y0 + h - bh, w / 12 - 6, bh);
  });
  [60, 120, 180].forEach(v => text(ctx, `${v}°`, x0 + ((v - 60) / 120) * w, y0 + h + 20, { size: 18, color: C.dust }));
  const used = bins.filter(n => n > 0).length;
  text(ctx, `${label}: ${used} ${used === 1 ? 'angle' : 'angles'} at the silicon`, x0 + w / 2, y0 - 14, { size: 22, color: C.text });
}

function whyDifferent(ctx, t, clock, a) {
  ctx.globalAlpha = a;
  const k = 8;
  [['quartz', 70], ['silica', 520]].forEach(([id, ox]) => {
    const s = SOLIDS[id];
    net(ctx, arrangementOf(s.picture), ox, 54, k, { jit: 0.03, clock });
    text(ctx, s.name, ox, 38, { size: 22, color: C.text, weight: 700, align: 'left' });
    histogram(ctx, arrangementOf(s.picture), ox, 340, 32 * k, 130, s.crystalline ? 'every silicon alike' : 'silicons differ');
  });
  ctx.globalAlpha = 1;
  void t;
}

function solidOrder(ctx, w, h, t, clock = 0) {
  ground(ctx, w, h);
  const a1 = 1 - ease(win(t, 0.32, 0.36));
  if (a1 > 0) { ctx.globalAlpha = a1; molecularMelt(ctx, t, clock); ctx.globalAlpha = 1; }
  const a2 = ease(win(t, 0.34, 0.38)) * (1 - ease(win(t, 0.68, 0.72)));
  if (a2 > 0) twoSilicas(ctx, t, clock, a2);
  const a3 = ease(win(t, 0.7, 0.74));
  if (a3 > 0) whyDifferent(ctx, t, clock, a3);
}

export const Q4_SCENES = {
  'solid-order': solidOrder
};
