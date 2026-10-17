/**
 * kits/domain-draw.js — The pictures the domain kit shares: a hub and its arms projected from three dimensions,
 * a lone pair's balloon, a bond's rods, an atom's disc.
 *
 * Pure over a 2D context. Every vector comes from `vsepr.js` (`planDomains`, `planDipole`); the projection is the
 * old domain rig's own `rotateView`, so a hub on a table and a hub on the rig look from the same place. Nothing here
 * decides anything: it paints what it is handed, and the hub, the card and the frame each hand it the same vectors.
 */

import { PLATE_COLORS, plateText } from '../../engine/plates.js';
import { TINTS } from '../../engine/scope.js';
import { rotateView } from '../../engine/domainrig.js';

export const AMBER = PLATE_COLORS.amber;
/** The view every hub is first seen from (the old rig's): a little turned, a little from above. */
export const YAW0 = 0.55;
export const PITCH = 0.35;

const TINT_OF = { H: 'bone', B: 'iron', C: 'iron', N: 'pale', O: 'rust', F: 'sand', Na: 'pale', P: 'sand', S: 'sand', Cl: 'sand', Xe: 'pale', X: 'pale', A: 'pale' };
const INK = { bone: '#2b2620', sand: '#2b2316', pale: '#1d1a16', iron: '#dcd6cc', rust: '#e8dccb' };
export const tintNameOf = sym => TINT_OF[sym] || 'pale';
export const tintOf = sym => TINTS[tintNameOf(sym)];
export const inkOf = sym => INK[tintNameOf(sym)];
const BIG = new Set(['Cl', 'S', 'P', 'Xe', 'Br']);
/** How big an atom is drawn against a unit of size: hydrogen small, a third-period atom large. */
export const sizeOf = sym => (sym === 'H' ? 0.62 : BIG.has(sym) ? 0.95 : 0.8);

/** A vector as a point on the plate, in units of an arm's length, y down; `z` is how near the viewer it stands. */
export function project(v, yaw = YAW0, pitch = PITCH) {
  const r = rotateView(v, yaw, pitch);
  const k = 1 / (1 - r[2] * 0.12);
  return { x: r[0] * k, y: -r[1] * k, z: r[2], k };
}

export function disc(ctx, x, y, r, fill, stroke, lw = 1) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.stroke();
}

/** An atom: its symbol on the element's own tint. */
export function atomDisc(ctx, x, y, r, sym, { lit = false, mask = false } = {}) {
  const t = tintOf(sym);
  disc(ctx, x, y, r, t.fill, lit ? AMBER : t.rim, lit ? 2 : 1);
  if (!mask) plateText(ctx, sym, x, y + r * 0.04, { size: Math.max(8, Math.round(r * (sym.length > 1 ? 0.84 : 1.0))), weight: 700, align: 'center', base: 'middle', color: inkOf(sym) });
}

/** Rods between two points: one for a single bond, two for a double, three for a triple. */
export function rods(ctx, ax, ay, bx, by, n, color = PLATE_COLORS.dust, gap = 4) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.4, 2.4 - n * 0.3);
  for (let i = 0; i < n; i++) {
    const off = (i - (n - 1) / 2) * gap;
    ctx.beginPath();
    ctx.moveTo(ax + nx * off, ay + ny * off);
    ctx.lineTo(bx + nx * off, by + ny * off);
    ctx.stroke();
  }
}

/** A lone pair: a dashed outline from the hub to a tip, with its two electrons in it. Told from an atom by the outline, never by colour. */
export function balloon(ctx, x0, y0, x1, y1, w, color = PLATE_COLORS.dust) {
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  const ang = Math.atan2(y1 - y0, x1 - x0);
  const len = Math.hypot(x1 - x0, y1 - y0);
  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(ang);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash?.([4, 3]);
  ctx.beginPath();
  ctx.ellipse(0, 0, Math.max(1, len / 2), Math.max(1, w), 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash?.([]);
  ctx.fillStyle = PLATE_COLORS.phosphor;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(s * len * 0.14, 0, Math.max(1.6, w * 0.22), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** An arrow from (x0, y0) to (x1, y1), its head at the end. */
export function arrow(ctx, x0, y0, x1, y1, lw, color, head = 6) {
  const ang = Math.atan2(y1 - y0, x1 - x0);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - Math.cos(ang - 0.4) * head, y1 - Math.sin(ang - 0.4) * head);
  ctx.lineTo(x1 - Math.cos(ang + 0.4) * head, y1 - Math.sin(ang + 0.4) * head);
  ctx.closePath();
  ctx.fill();
}

/**
 * A hub and its arms in a box, from `vectors` (`[{kind, sym, mult, v}]`, `planDomains` order), seen from `view`.
 * The picture on a molecule card; the hub plate draws its own arms as pieces. `S` is an arm's length in pixels.
 */
export function paintStar(ctx, cx, cy, S, hubSym, vectors, view = {}, opts = {}) {
  const yaw = view.yaw ?? YAW0;
  const pitch = view.pitch ?? PITCH;
  const base = Math.max(3, S * 0.3);
  const hub = project([0, 0, 0], yaw, pitch);
  const hx = cx + hub.x * S;
  const hy = cy + hub.y * S;
  const items = vectors.map((a, i) => ({ a, i, p: project(a.v, yaw, pitch) }));
  items.sort((p, q) => p.p.z - q.p.z);
  let hubDone = false;
  const drawHub = () => { atomDisc(ctx, hx, hy, base * 0.95, hubSym, { mask: opts.maskHub }); hubDone = true; };
  for (const it of items) {
    if (!hubDone && it.p.z >= 0) drawHub();
    const x = cx + it.p.x * S;
    const y = cy + it.p.y * S;
    if (it.a.kind === 'lone') {
      if (!opts.hideLone) balloon(ctx, hx, hy, x, y, base * 0.5 * it.p.k, opts.dimLone ? PLATE_COLORS.dim : PLATE_COLORS.dust);
    } else {
      rods(ctx, hx, hy, x, y, it.a.mult || 1, PLATE_COLORS.steel, Math.max(2, base * 0.28));
      atomDisc(ctx, x, y, base * sizeOf(it.a.sym) * it.p.k, it.a.sym);
    }
  }
  if (!hubDone) drawHub();
  return { hx, hy, base, points: items.map(it => ({ i: it.i, x: cx + it.p.x * S, y: cy + it.p.y * S })) };
}

/** The bold box a reading is printed in: fills `w` pixels at most. */
export function fitted(ctx, text, x, y, maxW, o = {}) {
  ctx.font = `${o.weight || 500} ${o.size}px "JetBrains Mono", "Quantico", monospace`;
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = o.base || 'middle';
  ctx.fillStyle = o.color || PLATE_COLORS.text;
  ctx.fillText(text, x, y, maxW);
}

/** A card: a dark slab with a hairline edge, amber when it is in the hand. */
export function slab(ctx, x0, y0, w, h, lit, fill = '#2a2620') {
  ctx.fillStyle = fill;
  ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = lit ? AMBER : PLATE_COLORS.dust;
  ctx.lineWidth = lit ? 2 : 1;
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
  ctx.lineWidth = 1;
}
