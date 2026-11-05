/**
 * story-scenes-teeter-q6.js — the story painter of Teeter's bench 6 (`q6-lean`), spread into `TEETER_SCENES` (`story-scenes-teeter.js`).
 * A 960-wide plate, a pure function of `t`; every number printed is read from the vessel the bench reads (`leanStress`, `leanAt`):
 * the amounts on the graph, Q and K on the scale, the pressure.
 *
 * `lean-push`, four beats:
 *   0 to 0.3     H2 added to the settled N2 + 3 H2 <-> 2 NH3 vessel: Q drops below K and climbs back as the amounts move.
 *   0.3 to 0.52  the vessel squeezed to half its volume: Q drops again and climbs back.
 *   0.52 to 0.72 argon added: the pressure reads higher and Q stays on K.
 *   0.72 to 1    the vessel heated from 673 K to 773 K: K itself moves, and Q is read against the new K.
 */

import { LEAN_RXNS, leanSettle, leanStress, leanAt, leanK, leanTotalP, fmtK } from '../learn/engine/eqdata.js';
import { C, text, ground, win, ease } from './story-kit.js';

const RXN = LEAN_RXNS.haber;
const BASE = { n: leanSettle(RXN, { N2: 1, H2: 3, NH3: 0 }, 1, 673).n, V: 1, T: 673 };
const INK = { N2: '#6f8fb0', H2: '#a8a090', NH3: '#c0652b' };
const TICKS = 60;
const fs = h => Math.max(13, h * 0.042);
const mn = s => String(s).replace(/-/g, '−');
const fq = v => (v <= 0 ? '0' : mn(fmtK(v)));

const PHASES = [
  { a: 0, b: 0.3, label: 'H₂ added: 1 mol', st: { add: { H2: 1 } } },
  { a: 0.3, b: 0.52, label: 'squeezed from 1 L to 0.5 L', st: { V: 0.5 } },
  { a: 0.52, b: 0.72, label: 'argon added: 2 mol', st: { inert: 2 } },
  { a: 0.72, b: 1, label: 'heated from 673 K to 773 K', st: { T: 773 } }
];

function box(ctx, x, y, w, h) {
  ctx.fillStyle = '#100f0c'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.steel; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function graph(ctx, res, tick, x, y, w, h, size) {
  box(ctx, x, y, w, h);
  const ymax = 3;
  const X = t => x + 8 + (t / TICKS) * (w - 120);
  const Y = v => y + h - 8 - (v / ymax) * (h - 16);
  const end = {};
  for (const sp of Object.keys(RXN.species)) {
    ctx.strokeStyle = INK[sp]; ctx.lineWidth = 2.4; ctx.beginPath();
    ctx.moveTo(x + 8, Y(BASE.n[sp])); ctx.lineTo(X(0), Y(BASE.n[sp])); ctx.lineTo(X(0), Y(res.post.n[sp]));
    for (let k = 1; k <= tick; k++) ctx.lineTo(X(k), Y(leanAt(RXN, res, k).n[sp]));
    ctx.stroke(); ctx.lineWidth = 1;
    end[sp] = leanAt(RXN, res, tick).n[sp];
  }
  const ys = Object.entries(end).map(([sp, v]) => ({ sp, v, y: Y(v) })).sort((p, q) => p.y - q.y);
  for (let i = 1; i < ys.length; i++) if (ys[i].y - ys[i - 1].y < size * 1.2) ys[i].y = ys[i - 1].y + size * 1.2;
  for (const e of ys) text(ctx, `${RXN.names[e.sp]} ${e.v.toFixed(2)}`, x + w - 104, e.y, { size, color: INK[e.sp], align: 'left', weight: 700 });
}

function scale(ctx, Q, K, K0, x, y, w, size) {
  const lo = -7; const hi = -1;
  const xOf = v => x + ((Math.min(hi, Math.max(lo, v > 0 ? Math.log10(v) : lo))) - lo) / (hi - lo) * w;
  ctx.strokeStyle = C.steel; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
  for (let e = lo; e <= hi; e++) { ctx.beginPath(); ctx.moveTo(xOf(10 ** e), y); ctx.lineTo(xOf(10 ** e), y + 8); ctx.stroke(); text(ctx, e === 0 ? '1' : mn(`1e${e}`), xOf(10 ** e), y + 8 + size, { size: size * 0.85, color: C.dim }); }
  if (Math.abs(Math.log(K / K0)) > 1e-9) { ctx.strokeStyle = C.dim; ctx.beginPath(); ctx.moveTo(xOf(K0), y - 22); ctx.lineTo(xOf(K0), y + 6); ctx.stroke(); }
  ctx.strokeStyle = C.text; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(xOf(K), y - 26); ctx.lineTo(xOf(K), y + 6); ctx.stroke(); ctx.lineWidth = 1;
  ctx.fillStyle = C.amber; ctx.beginPath(); ctx.moveTo(xOf(Q), y - 2); ctx.lineTo(xOf(Q) - 9, y - 24); ctx.lineTo(xOf(Q) + 9, y - 24); ctx.closePath(); ctx.fill();
  text(ctx, `Q ${fq(Q)}`, x, y - 44, { size, color: C.amber, align: 'left', weight: 700 });
  text(ctx, `K ${fq(K)}`, x + w, y - 44, { size, color: C.text, align: 'right', weight: 700 });
}

function leanPush(ctx, w, h, t) {
  ground(ctx, w, h);
  const ph = PHASES.find(p => t < p.b) || PHASES[3];
  const res = leanStress(RXN, BASE, ph.st);
  const tick = Math.round(ease(win(t, ph.a + (ph.b - ph.a) * 0.08, ph.b - (ph.b - ph.a) * 0.05)) * TICKS);
  const now = leanAt(RXN, res, tick);
  const size = fs(h);
  text(ctx, ph.label, w * 0.5, h * 0.08, { size: size * 1.1, color: C.dust, weight: 700 });
  graph(ctx, res, tick, w * 0.07, h * 0.14, w * 0.86, h * 0.44, size);
  scale(ctx, now.Q, now.K, leanK(RXN, 673), w * 0.12, h * 0.8, w * 0.76, size);
  const P = leanTotalP(RXN, now.n, res.post.V, res.post.T, res.inert);
  text(ctx, `pressure ${Math.round(P)} atm   tick ${tick}`, w * 0.5, h * 0.66, { size, color: C.dim });
}

export const TEETER_Q6_SCENES = { 'lean-push': leanPush };
