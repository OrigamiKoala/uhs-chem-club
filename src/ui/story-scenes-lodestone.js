/**
 * story-scenes-lodestone.js — Vess's debrief painters for Lodestone (unit12), authored on 960 × 540 and registered in `story-scenes.js`
 * through `legacy()`. Every number on screen is counted from what is drawn or read from `lodedata.js`.
 */

import { C, text, ground, win, ease } from './story-kit.js';
import { fillLevel, shellLevels, IE, removalOrder } from '../learn/engine/lodedata.js';

const S4 = '#c9a35a'; const D3 = '#6f8fb0';

/** One orbital box with 0, 1 or 2 electrons, on the scene's 960 × 540 plate. */
function box(ctx, x, y, n, col) {
  ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.strokeRect(x, y, 44, 38);
  const arrow = (cx, up) => {
    ctx.strokeStyle = C.text; ctx.fillStyle = C.text; ctx.lineWidth = 3;
    const t = y + 8; const b = y + 30;
    ctx.beginPath(); ctx.moveTo(cx, up ? b : t); ctx.lineTo(cx, up ? t : b); ctx.stroke();
    const tip = up ? t : b; const s = up ? 1 : -1;
    ctx.beginPath(); ctx.moveTo(cx, tip); ctx.lineTo(cx - 6, tip + s * 8); ctx.lineTo(cx + 6, tip + s * 8); ctx.closePath(); ctx.fill();
  };
  if (n >= 1) arrow(n === 2 ? x + 15 : x + 22, true);
  if (n >= 2) arrow(x + 29, false);
  ctx.lineWidth = 1;
}

/** A ladder: 4s and five 3d boxes at the energies of `charge`, holding `s` and `d`. */
function ladder(ctx, x0, yBase, charge, s, d, label) {
  const L = shellLevels(charge);
  const yOf = e => yBase - (e + 0.8) * 110;
  const y4s = yOf(L[0].e); const y3d = yOf(L[1].e);
  box(ctx, x0, y4s, s, S4);
  text(ctx, '4s', x0 - 12, y4s + 19, { size: 22, color: S4, align: 'right', weight: 700 });
  fillLevel(5, d).forEach((n, i) => box(ctx, x0 + 80 + i * 52, y3d, n, D3));
  text(ctx, '3d', x0 + 68, y3d + 19, { size: 22, color: D3, align: 'right', weight: 700 });
  text(ctx, label, x0 + 170, yBase + 78, { size: 24, color: C.text, weight: 700 });
}

/** q1-dblock: iron fills 4s then 3d; as Fe²⁺ the 3d level drops below 4s and the 4s pair leaves; Fe³⁺ keeps five 3d electrons. */
function dblock(ctx, w, h, t) {
  ground(ctx, w, h);
  const fill = Math.min(8, Math.floor(ease(win(t, 0.02, 0.3)) * 8.999));
  if (t < 0.36) {
    ladder(ctx, 260, 330, 0, Math.min(2, fill), Math.max(0, fill - 2), `Iron: ${fill} of 8 outer electrons`);
    return;
  }
  // The charge rises to +2: the levels glide, then the two 4s electrons leave.
  const q = t < 0.7 ? 2 * ease(win(t, 0.36, 0.5)) : 2 + ease(win(t, 0.72, 0.85));
  const s = t < 0.55 ? 2 : 0;
  const d = t < 0.86 ? 6 : 5;
  const name = t < 0.55 ? 'Iron, taking a charge' : t < 0.86 ? 'Fe²⁺: 3d⁶' : 'Fe³⁺: 3d⁵, the sealed drum';
  ladder(ctx, 260, 330, Math.min(1, q), s, d, name);
  if (t > 0.5 && t < 0.7) {
    const p = win(t, 0.55, 0.68);
    ctx.globalAlpha = 1 - p;
    ctx.fillStyle = C.amber; ctx.beginPath(); ctx.arc(282, 140 - p * 90, 9, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
}

const SUB = { '4s': S4, '3d': D3, '3p': '#8f6a8a' };

/** A strip of successive ionization energies for `el`, the first `n` bars grown by `p`, coloured by the level each electron left. */
function strip(ctx, x0, y0, w, h, el, n, p, label, q0 = 0) {
  const from = removalOrder(el, q0, n); const bw = w / n;
  ctx.strokeStyle = C.steel; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + h); ctx.lineTo(x0 + w, y0 + h); ctx.stroke(); ctx.lineWidth = 1;
  for (let i = 0; i < n; i++) {
    const g = Math.max(0, Math.min(1, p * n - i));
    if (!g) continue;
    const v = IE[el][q0 + i]; const hh = (v / 20000) * h * g;
    ctx.fillStyle = SUB[from[i]]; ctx.fillRect(x0 + i * bw + bw * 0.15, y0 + h - hh, bw * 0.7, hh);
    if (g >= 1) text(ctx, Math.round(v).toLocaleString('en-US'), x0 + i * bw + bw * 0.5, y0 + h - hh - 12, { size: 13, color: C.text });
  }
  text(ctx, label, x0 + w / 2, y0 + h + 26, { size: 22, color: C.text, weight: 700 });
}

/** q2-charges: calcium's jump after two, manganese's after seven, then the third electron of Mn²⁺ and Fe²⁺. */
function charges(ctx, w, h, t) {
  ground(ctx, w, h);
  if (t < 0.66) {
    strip(ctx, 90, 90, 340, 260, 'Ca', 8, ease(win(t, 0.02, 0.28)), 'Calcium');
    if (t > 0.33) strip(ctx, 530, 90, 340, 260, 'Mn', 8, ease(win(t, 0.34, 0.6)), 'Manganese');
    return;
  }
  const p = ease(win(t, 0.68, 0.9));
  const bars = [['Mn²⁺', IE.Mn[2], 300], ['Fe²⁺', IE.Fe[2], 560]];
  ctx.strokeStyle = C.steel; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(220, 400); ctx.lineTo(740, 400); ctx.stroke(); ctx.lineWidth = 1;
  for (const [name, v, x] of bars) {
    const hh = (v / 4000) * 280 * p;
    ctx.fillStyle = D3; ctx.fillRect(x, 400 - hh, 100, hh);
    if (p >= 1) text(ctx, `${Math.round(v).toLocaleString('en-US')} kJ/mol`, x + 50, 400 - hh - 18, { size: 20, color: C.text, weight: 700 });
    text(ctx, `${name}: third electron`, x + 50, 432, { size: 20, color: C.text });
  }
}

const OCT = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const proj = ([x, y, z]) => { const a = 0.5; const t = 0.4; const x1 = x * Math.cos(a) - y * Math.sin(a); const y1 = x * Math.sin(a) + y * Math.cos(a); return { x: x1, y: -(z * Math.cos(t) + y1 * Math.sin(t)), d: y1 }; };
const INK = { h2o: '#b5573a', nh3: '#6f8fb0', cl: '#7fa04a' };
const SYM = { h2o: 'H₂O', nh3: 'NH₃', cl: 'Cl⁻' };

/** A complex drawn round (cx, cy): the metal and the ligands at its places (ids, '' for empty). */
function complex(ctx, cx, cy, R, metal, ligs) {
  const pts = OCT.map((d, i) => ({ ...proj(d), i })).sort((a, b) => a.d - b.d);
  const one = (q) => {
    const id = ligs[q.i]; if (!id) return;
    const x = cx + q.x * R; const y = cy + q.y * R;
    ctx.strokeStyle = C.steel; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke(); ctx.lineWidth = 1;
    ctx.fillStyle = INK[id]; ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2); ctx.fill();
    text(ctx, SYM[id], x, y + 30, { size: 16, color: C.text, weight: 700 });
  };
  pts.filter(q => q.d < 0).forEach(one);
  ctx.fillStyle = '#b88a5a'; ctx.beginPath(); ctx.arc(cx, cy, 24, 0, Math.PI * 2); ctx.fill();
  text(ctx, metal, cx, cy, { size: 18, color: '#14100c', weight: 700 });
  pts.filter(q => q.d >= 0).forEach(one);
}

/** q3-complex: copper's waters swapped for ammonia; the bond's two electrons, both nitrogen's; six round iron, four round copper, the drum. */
function complexScene(ctx, w, h, t) {
  ground(ctx, w, h);
  if (t < 0.32) {
    const k = Math.min(4, Math.floor(ease(win(t, 0.04, 0.28)) * 4.999));
    const order = [0, 2, 1, 3];
    const ligs = OCT.map((_, i) => (order.indexOf(i) >= 0 && order.indexOf(i) < k ? 'nh3' : 'h2o'));
    complex(ctx, 480, 260, 130, 'Cu²⁺', ligs);
    text(ctx, `${k} of 4 water molecules in the plane replaced by ammonia`, 480, 470, { size: 20, color: C.text });
    return;
  }
  if (t < 0.64) {
    const p = ease(win(t, 0.34, 0.55));
    ctx.fillStyle = '#b88a5a'; ctx.beginPath(); ctx.arc(330, 260, 40, 0, Math.PI * 2); ctx.fill();
    text(ctx, 'Cu²⁺', 330, 260, { size: 20, color: '#14100c', weight: 700 });
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; ctx.fillStyle = '#c98f4a'; ctx.beginPath(); ctx.arc(330 + Math.cos(a) * 62, 260 + Math.sin(a) * 62, 7, 0, Math.PI * 2); ctx.fill(); }
    const nx = 700 - 230 * p;
    ctx.fillStyle = '#6f8fb0'; ctx.beginPath(); ctx.arc(nx, 260, 26, 0, Math.PI * 2); ctx.fill();
    text(ctx, 'N', nx, 260, { size: 20, color: '#0e1218', weight: 700 });
    for (const dy of [-9, 9]) { ctx.fillStyle = '#6f8fb0'; ctx.beginPath(); ctx.arc(nx - 40 - 10 * p, 260 + dy, 7, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#d8e4f0'; ctx.stroke(); }
    text(ctx, 'copper\'s 3d electrons: 9', 330, 360, { size: 20, color: C.text });
    text(ctx, 'two from nitrogen\'s lone pair', 620, 360, { size: 20, color: C.text });
    return;
  }
  complex(ctx, 220, 250, 100, 'Fe³⁺', ['h2o', 'h2o', 'h2o', 'h2o', 'h2o', 'h2o']);
  text(ctx, '6 bonded', 220, 420, { size: 20, color: C.text, weight: 700 });
  if (t > 0.72) {
    complex(ctx, 480, 250, 100, 'Cu²⁺', ['cl', 'cl', 'cl', 'cl', '', '']);
    text(ctx, '4 bonded', 480, 420, { size: 20, color: C.text, weight: 700 });
  }
  if (t > 0.84) {
    complex(ctx, 740, 250, 100, 'Cr³⁺', ['cl', 'cl', 'h2o', 'h2o', 'h2o', 'h2o']);
    text(ctx, '+3 − 2 = +1', 740, 420, { size: 20, color: C.text, weight: 700 });
  }
}

const SQ = [[1, 0, 0], [0, 1, 0], [-1, 0, 0], [0, -1, 0]];
/** A flat square complex seen from above, Pt²⁺ with its four ligands. */
function square(ctx, cx, cy, R, ligs, label) {
  SQ.forEach(([x, y], i) => {
    const px = cx + x * R; const py = cy - y * R;
    ctx.strokeStyle = C.steel; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke(); ctx.lineWidth = 1;
    ctx.fillStyle = INK[ligs[i]]; ctx.beginPath(); ctx.arc(px, py, ligs[i] === 'cl' ? 20 : 15, 0, Math.PI * 2); ctx.fill();
    text(ctx, SYM[ligs[i]], px, py + 34, { size: 16, color: C.text, weight: 700 });
  });
  ctx.fillStyle = '#b88a5a'; ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fill();
  text(ctx, 'Pt²⁺', cx, cy, { size: 16, color: '#14100c', weight: 700 });
  text(ctx, label, cx, cy + R + 64, { size: 24, color: C.text, weight: 700 });
}

/** q4-shapes: the ring that settles into an octahedron; cis and trans; the two names. */
function shapes(ctx, w, h, t) {
  ground(ctx, w, h);
  if (t < 0.32) {
    const g = ease(win(t, 0.06, 0.26));
    const ring = Array.from({ length: 6 }, (_, i) => [Math.cos(i * Math.PI / 3), Math.sin(i * Math.PI / 3), 0]);
    const tgt = [OCT[0], OCT[2], OCT[4], OCT[1], OCT[3], OCT[5]];
    const ligs = ['nh3', 'nh3', 'nh3', 'nh3', 'nh3', 'nh3'];
    const cx = 480; const cy = 250; const R = 140;
    const pts = ring.map((r, i) => { const v = r.map((x, k) => x + (tgt[i][k] - x) * g); const m = Math.hypot(...v) || 1; return { ...proj(v.map(x => x / m)), i }; }).sort((a, b) => a.d - b.d);
    for (const q of pts) { const x = cx + q.x * R; const y = cy + q.y * R; ctx.strokeStyle = C.steel; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke(); ctx.lineWidth = 1; ctx.fillStyle = INK[ligs[q.i]]; ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#b88a5a'; ctx.beginPath(); ctx.arc(cx, cy, 24, 0, Math.PI * 2); ctx.fill();
    text(ctx, g < 1 ? 'released from a flat ring' : 'an octahedron: 90° between neighbours', cx, 470, { size: 22, color: C.text });
    return;
  }
  square(ctx, 300, 240, 110, ['cl', 'cl', 'nh3', 'nh3'], t > 0.64 ? 'cis' : 'model A');
  square(ctx, 660, 240, 110, ['cl', 'nh3', 'cl', 'nh3'], t > 0.64 ? 'trans' : 'model B');
  if (t > 0.45 && t < 0.64) text(ctx, 'no turn or flip lays B on A', 480, 470, { size: 22, color: C.amber, weight: 700 });
}

export const LODESTONE_SCENES = {
  'lode-shapes': shapes,
  'lode-complex': complexScene,
  'lode-charges': charges,
  'lode-dblock': dblock
};
