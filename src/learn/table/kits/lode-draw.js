/**
 * kits/lode-draw.js — the drawing helpers every Lodestone painter shares: words, frames, orbital boxes with their electrons, a glide clock.
 * Pure functions of what they are given; memory for glides lives in `heat-motion.js`'s map under `lode:` keys.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { glide as heatGlide, sinceChange } from './heat-motion.js';

export const C = Object.freeze({
  ...PLATE_COLORS,
  e: '#e8dcc0',          // an electron
  eDim: 'rgba(232,220,192,0.35)',
  box: '#8a8174',
  s4: '#c9a35a',          // 4s
  d3: '#6f8fb0',          // 3d
  p3: '#8f6a8a',          // 3p (core)
  metal: '#b88a5a',
  nIn: '#6f8fb0',         // nitrogen's electrons
  cuIn: '#c98f4a',        // copper's electrons
  glass: '#141a20',
  win: '#100f0c'
});

export const frameOf = b => ({
  x: d => b.X(b.lay.box.x0 + d),
  y: d => b.Y(b.lay.box.y0 + d),
  len: d => d * b.sc,
  size: (k, min = 6.5) => Math.max(min, k * b.sc)
});

/** Words, in the plate's face. `o`: align, base, color, weight, maxW, sans (element symbols read best in the sans face). */
export function say(ctx, text, x, y, size, o = {}) {
  const face = o.sans ? '"Quantico", "Helvetica Neue", Arial, sans-serif' : '"JetBrains Mono", "Quantico", monospace';
  ctx.font = `${o.weight || 500} ${Math.max(6, size)}px ${face}`;
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.base || 'middle';
  ctx.fillStyle = o.color || C.text;
  if (o.maxW) ctx.fillText(String(text), x, y, o.maxW); else ctx.fillText(String(text), x, y);
}

/** Where the painted content of a fixture begins (below its row of dials). */
export const topOf = (f, lay) => (lay.dials.length ? lay.dials.reduce((a, d) => Math.max(a, d.y), 0) - lay.box.y0 + 4.2 : 4.4);

export function title(ctx, f, F, b, text) {
  say(ctx, text ?? f.label, F.x(2.2), F.y(3.2), F.size(2.8, 8), { color: C.dust, weight: 600, maxW: F.len(f.size.w * 0.5) });
}

/** An orbital box at (x, y) units, w × h, holding `n` electrons (↑, then ↑↓). `lit` rings it amber. */
export function orbital(ctx, F, x, y, w, h, n, { lit = false, ghost = 0, colour = C.box } = {}) {
  ctx.strokeStyle = lit ? C.amber : colour;
  ctx.lineWidth = lit ? 2 : 1.2;
  ctx.strokeRect(Math.round(F.x(x)) + 0.5, Math.round(F.y(y)) + 0.5, Math.round(F.len(w)), Math.round(F.len(h)));
  ctx.lineWidth = 1;
  const arrow = (cx, up, alpha) => {
    const top = F.y(y + h * 0.18); const bot = F.y(y + h * 0.82);
    const X = F.x(cx);
    ctx.strokeStyle = alpha < 1 ? C.eDim : C.e; ctx.fillStyle = alpha < 1 ? C.eDim : C.e;
    ctx.lineWidth = Math.max(1.5, F.len(0.32));
    ctx.beginPath(); ctx.moveTo(X, up ? bot : top); ctx.lineTo(X, up ? top : bot); ctx.stroke();
    const hd = F.len(Math.min(1.1, w * 0.18)); const tip = up ? top : bot; const s = up ? 1 : -1;
    ctx.beginPath(); ctx.moveTo(X, tip); ctx.lineTo(X - hd, tip + s * hd * 1.2); ctx.lineTo(X + hd, tip + s * hd * 1.2); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 1;
  };
  if (n >= 1) arrow(n === 2 ? x + w * 0.33 : x + w * 0.5, true, 1);
  if (n >= 2) arrow(x + w * 0.67, false, 1);
  if (ghost) arrow(x + w * 0.5, true, 0.4);
}

/** The value to show for `key` at the clock: `target` once arrived, on the way while a change runs. */
export const glide = (key, b, from, target, dur = 0.9) => heatGlide(`lode:${b.scope || ''}:${key}`, b.clock, from, target, dur);
export const since = (key, b) => sinceChange(`lode:${b.scope || ''}:${key}`, b.clock);

/** Draw an amber pick frame round a fixture whose `pick` is the chosen value of its choice. */
export function paintPick(ctx, f, state, b) {
  const pk = f.props?.pick;
  if (!pk || pk.fixture === f.id) return;
  const F = frameOf(b);
  const chosen = Math.round(state.fixtures[pk.fixture]?.dials?.[pk.dial || 'value']?.value ?? 0);
  ctx.lineWidth = chosen === pk.value ? Math.max(1.6, F.len(0.45)) : 1;
  ctx.strokeStyle = chosen === pk.value ? C.amber : C.dim;
  if (chosen !== pk.value) ctx.setLineDash([2, 3]);
  ctx.strokeRect(F.x(0.4), F.y(0.4), F.len(f.size.w - 0.8), F.len(f.size.h - 0.8));
  ctx.setLineDash([]); ctx.lineWidth = 1;
}

export const fixed = (v, n = 0) => (Math.round((v + Math.sign(v) * 1e-9) * 10 ** n) / 10 ** n).toFixed(n);
export const signed = q => (q > 0 ? `+${q}` : q < 0 ? `−${-q}` : '0');
export const supNum = q => { const m = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }; return String(Math.abs(q)).split('').map(c => m[c]).join(''); };
export const ionName = (el, q) => (q ? `${el}${q === 1 ? '' : supNum(q)}${q > 0 ? '⁺' : '⁻'}` : el);
