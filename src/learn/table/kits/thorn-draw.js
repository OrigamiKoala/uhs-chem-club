/**
 * kits/thorn-draw.js — the drawing helpers every Thornmere painter shares: words, frames, atoms, bonds, electron pairs, curved arrows and
 * a clock for a change that has just happened. Pure functions of what they are given; a change's start time lives in `heat-motion.js`'s
 * map under `thorn:` keys, never on a fixture.
 *
 * COLOUR. Carbon is dark, hydrogen pale, oxygen rust, nitrogen steel blue, the halogens ochre and olive. A shared or lone pair of
 * electrons is two pale dots; the second pair of a double bond is drawn in rust, beside the line between the atoms.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { glide as heatGlide, progressOf } from './heat-motion.js';
import { EL, pairPlace, pairsOf } from '../../engine/thorndata.js';

export const C = Object.freeze({
  ...PLATE_COLORS,
  e: '#efe6cf',           // an electron pair
  pi: '#d07a4a',          // the second pair of a double bond
  bond: '#8a8174',
  win: '#100f0c',
  orange: '#c9772e',      // bromine water
  clear: '#3b3a36',
  plus: '#6f8fb0',
  minus: '#c0652b'
});

export const ATOM_INK = Object.freeze({
  C: { fill: '#3a3632', text: '#e8e2d6', ring: '#8a8174' },
  H: { fill: '#d6cebd', text: '#14100c', ring: '#d6cebd' },
  O: { fill: '#a8502f', text: '#f4ead8', ring: '#c0652b' },
  N: { fill: '#4f6f92', text: '#f0ece2', ring: '#6f8fb0' },
  Br: { fill: '#8a5a2a', text: '#f4ead8', ring: '#b07a3a' },
  Cl: { fill: '#6c7a3c', text: '#f4ead8', ring: '#8f9c52' },
  F: { fill: '#7a8a5a', text: '#14100c', ring: '#9aa870' },
  Na: { fill: '#77706a', text: '#f0ece2', ring: '#a39a90' }
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

export function title(ctx, f, F, b, text) {
  say(ctx, text ?? f.label, F.x(2.2), F.y(3.2), F.size(2.6, 8), { color: C.dust, weight: 600, maxW: F.len(f.size.w * 0.62) });
}
/** The line at the foot of a fixture: what the last action showed. */
export function foot(ctx, f, F, text, color = C.dust, right = 0) {
  say(ctx, text, F.x(2.2), F.y(f.size.h - 3.2), F.size(1.95, 6.4), { color, weight: 600, maxW: F.len(f.size.w - 4.4 - right) });
}

export const ease = k => { const c = Math.max(0, Math.min(1, k)); return c * c * (3 - 2 * c); };
export const lerp = (a, b, k) => a + (b - a) * k;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/**
 * How far along (0 to 1) the change counted by `n` is: 0 at the moment `n` last changed, 1 once `dur` seconds have passed, and 1 with no
 * clock (the built table's printed face) or on a first look.
 */
export function progress(key, b, n, dur = 1.8) {
  const k = `thorn:${b.scope || ''}:${key}`;
  heatGlide(k, b.clock, n - 1, n, dur);
  return progressOf(k, b.clock, dur);
}

/* ------------------------------------------------------------------ a scene's geometry */

/** The box round every atom of the given scenes, in scene units. */
export function boundsOf(scenes, pad = 0.5) {
  let x0 = Infinity; let x1 = -Infinity; let y0 = Infinity; let y1 = -Infinity;
  for (const s of scenes) for (const a of Object.values(s.atoms)) { x0 = Math.min(x0, a.x); x1 = Math.max(x1, a.x); y0 = Math.min(y0, a.y); y1 = Math.max(y1, a.y); }
  return { x0: x0 - pad, x1: x1 + pad, y0: y0 - pad, y1: y1 + pad };
}

/**
 * A map from scene units to fixture units: the scenes fitted into `rect` ({x, y, w, h} in fixture units), y up, centred. `unit` is one
 * bond length in fixture units.
 */
export function fitScenes(scenes, rect, maxUnit = 13) {
  const bb = boundsOf(scenes);
  const unit = Math.min(maxUnit, rect.w / (bb.x1 - bb.x0), rect.h / (bb.y1 - bb.y0));
  const cx = rect.x + rect.w / 2; const cy = rect.y + rect.h / 2;
  const mx = (bb.x0 + bb.x1) / 2; const my = (bb.y0 + bb.y1) / 2;
  return { unit, X: x => cx + (x - mx) * unit, Y: y => cy - (y - my) * unit };
}

/** Where each pair of a scene is drawn, in scene units: `{ id, x, y, kind }`. */
export function pairPoints(scene) {
  const out = [];
  for (const p of pairsOf(scene)) {
    const A = scene.atoms[p.a];
    if (p.kind === 'l') {
      const r = 0.42; const a = (p.angle * Math.PI) / 180;
      out.push({ id: p.id, kind: 'l', x: A.x + r * Math.cos(a), y: A.y + r * Math.sin(a), ax: Math.cos(a), ay: Math.sin(a) });
      continue;
    }
    const B = scene.atoms[p.b];
    const t = pairPlace(A.el, B.el);
    const dx = B.x - A.x; const dy = B.y - A.y; const L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L; const ny = dx / L;
    const off = p.kind === 'p' ? 0.34 : 0;
    out.push({ id: p.id, kind: p.kind, x: A.x + dx * t + nx * off, y: A.y + dy * t + ny * off, ax: dx / L, ay: dy / L });
  }
  return out;
}

/* ------------------------------------------------------------------ drawing a scene */

const dotPair = (ctx, x, y, ux, uy, r, color, alpha = 1) => {
  ctx.globalAlpha = alpha; ctx.fillStyle = color;
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + s * ux * r * 1.25, y + s * uy * r * 1.25, r, 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = 1;
};

/**
 * Draw one scene (or a scene part-way to the next). `G` is `fitScenes`' map; `F` the fixture frame. Options:
 *   pairs     draw every shared and lone pair as two dots
 *   skeletal  draw only the lines between carbons (no letters, no hydrogens)
 *   to, k     the scene being moved toward and how far (0 to 1): atoms glide, bonds that end fade, bonds that begin appear
 *   lit       ids (atoms `a:id`, bonds `b:a-b`, pairs) to ring in amber
 *   marks     atom ids ringed in dust (atoms that came from one molecule)
 *   hide      pair ids not drawn (a pair that is in flight)
 */
export function drawScene(ctx, F, G, scene, o = {}) {
  const k = o.to ? ease(o.k ?? 0) : 0;
  const to = o.to || scene;
  const pos = id => {
    const a = scene.atoms[id]; const b2 = to.atoms[id] || a;
    return { x: F.x(G.X(lerp(a.x, b2.x, k))), y: F.y(G.Y(lerp(a.y, b2.y, k))) };
  };
  const u = F.len(G.unit);
  const lit = new Set(o.lit || []);
  const has = (s, a, b) => s.bonds.find(([x, y]) => (x === a && y === b) || (x === b && y === a));

  // Bonds: those of this scene (fading if the next scene has lost them), then those the next scene gains.
  const line = (a, b, order, alpha, hot) => {
    const p = pos(a); const q = pos(b);
    const dx = q.x - p.x; const dy = q.y - p.y; const L = Math.hypot(dx, dy) || 1;
    const nx = (-dy / L) * u * 0.085; const ny = (dx / L) * u * 0.085;
    ctx.globalAlpha = alpha; ctx.strokeStyle = hot ? C.amber : C.bond; ctx.lineWidth = Math.max(1.4, u * (hot ? 0.075 : 0.055));
    const draw = (ox, oy) => { ctx.beginPath(); ctx.moveTo(p.x + ox, p.y + oy); ctx.lineTo(q.x + ox, q.y + oy); ctx.stroke(); };
    if (order >= 2) { draw(nx, ny); draw(-nx, -ny); } else draw(0, 0);
    ctx.globalAlpha = 1; ctx.lineWidth = 1;
  };
  for (const [a, b, order] of scene.bonds) {
    if (o.skeletal && (scene.atoms[a].el !== 'C' || scene.atoms[b].el !== 'C')) continue;
    const next = o.to ? has(to, a, b) : [a, b, order];
    const hot = lit.has(`b:${a}-${b}`) || lit.has(`b:${b}-${a}`);
    if (!next) line(a, b, order, 1 - k, hot);
    else if (next[2] !== order) { line(a, b, order, 1 - k, hot); line(a, b, next[2], k, hot); }
    else line(a, b, order, 1, hot);
  }
  if (o.to) for (const [a, b, order] of to.bonds) if (!has(scene, a, b) && scene.atoms[a] && scene.atoms[b]) line(a, b, order, k, false);
  if (o.skeletal) return;

  // Electron pairs, at their places along each bond and beside each atom.
  if (o.pairs) {
    const hide = new Set(o.hide || []);
    const src = k < 0.5 ? scene : to;
    const alpha = o.to ? Math.abs(1 - 2 * k) : 1;
    for (const p of pairPoints(src)) {
      if (hide.has(p.id)) continue;
      const x = F.x(G.X(p.x)); const y = F.y(G.Y(p.y));
      // Along a bond the two dots straddle the line; a lone pair's dots lie across the direction it points.
      const across = { x: -p.ay, y: p.ax };
      dotPair(ctx, x, y, across.x, -across.y, Math.max(1.5, u * 0.062), p.kind === 'p' ? C.pi : C.e, alpha);
      if (lit.has(p.id)) { ctx.strokeStyle = C.amber; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, Math.max(5, u * 0.2), 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1; }
    }
  }

  // Atoms.
  for (const [id, a] of Object.entries(scene.atoms)) {
    const p = pos(id);
    const ink = ATOM_INK[a.el] || ATOM_INK.C;
    const r = a.label ? u * 0.3 : a.el === 'H' ? u * 0.17 : u * 0.24;
    const b2 = to.atoms[id] || a;
    const q = k < 0.5 ? (a.q || 0) : (b2.q || 0);
    if (a.label) {
      ctx.fillStyle = C.win; ctx.fillRect(p.x - r * 1.25, p.y - r * 0.8, r * 2.5, r * 1.6);
      say(ctx, a.label, p.x, p.y, Math.max(7, u * 0.3), { align: 'center', color: C.text, weight: 700, sans: true });
    } else {
      ctx.fillStyle = ink.fill; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      say(ctx, a.el, p.x, p.y + 0.5, Math.max(6.5, a.el === 'H' ? u * 0.22 : u * 0.3), { align: 'center', color: ink.text, weight: 800, sans: true });
    }
    if (q) {
      // A charge, in a small disc clear of the atom's pairs.
      const qx = p.x + r * 1.55; const qy = p.y - r * 1.55; const qr = Math.max(4.5, u * 0.15);
      ctx.fillStyle = C.win; ctx.beginPath(); ctx.arc(qx, qy, qr, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = q > 0 ? C.plus : C.minus; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(qx, qy, qr, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1;
      say(ctx, q > 0 ? '+' : '−', qx, qy + 0.5, Math.max(8, u * 0.3), { align: 'center', color: q > 0 ? C.plus : C.minus, weight: 800, sans: true });
    }
    if ((o.marks || []).includes(id)) { ctx.strokeStyle = C.dust; ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.arc(p.x, p.y, r * 1.5, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
    if (lit.has(`a:${id}`)) { ctx.strokeStyle = C.amber; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, r * 1.45, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1; }
  }
}

/**
 * A curved arrow from a pair to an atom, drawn up to fraction `k` of its length, with the pair itself (two dots) at its head while it
 * travels. `back` draws the pair returning (a move that failed).
 */
export function drawArrow(ctx, from, toPt, k, { color = C.amber, pairColor = C.e, r = 2 } = {}) {
  const mx = (from.x + toPt.x) / 2; const my = (from.y + toPt.y) / 2;
  const dx = toPt.x - from.x; const dy = toPt.y - from.y; const L = Math.hypot(dx, dy) || 1;
  const cx = mx - (dy / L) * L * 0.28; const cy = my + (dx / L) * L * 0.28;
  const at = t => ({ x: (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * cx + t * t * toPt.x, y: (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * cy + t * t * toPt.y });
  const kk = clamp(k, 0, 1);
  ctx.strokeStyle = color; ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i <= 16; i++) { const p = at((kk * i) / 16); if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }
  ctx.stroke();
  const head = at(kk); const prev = at(Math.max(0, kk - 0.08));
  const hx = head.x - prev.x; const hy = head.y - prev.y; const hl = Math.hypot(hx, hy) || 1;
  const s = Math.max(4, r * 2.2);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(head.x, head.y);
  ctx.lineTo(head.x - (hx / hl) * s - (hy / hl) * s * 0.5, head.y - (hy / hl) * s + (hx / hl) * s * 0.5);
  ctx.lineTo(head.x - (hx / hl) * s + (hy / hl) * s * 0.5, head.y - (hy / hl) * s - (hx / hl) * s * 0.5);
  ctx.closePath(); ctx.fill();
  dotPair(ctx, head.x, head.y, -hy / hl, hx / hl, r, pairColor);
  ctx.lineWidth = 1;
}

export const elName = el => EL[el].name;
export const fixed1 = v => (Math.round((v + Math.sign(v) * 1e-9) * 10) / 10).toFixed(1).replace('-', '−');
