/**
 * kits/pot-draw.js — What the pot kit's pieces and fixtures look like (Kettle).
 *
 * The drawn tabletop (`engine/table2d.js`) and the built one (`engine/table3d.js`) call THESE functions with the same arguments.
 * A figure printed here is a planner's answer read through `pot-read.js`; a painter decides nothing. A kind this file does not
 * draw is the heat kit's (`heat-draw.js`), which the pot kit extends.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { paintPiece as heatPiece, paintFixture as heatFixture, faceKey as heatFaceKey, RECTS as HEAT_RECTS, contentTop } from './heat-draw.js';
import { fixtureHandler, pieceDef } from './pot-registry.js';

const AMBER = PLATE_COLORS.amber;
const DUST = PLATE_COLORS.dust;

export function say(ctx, text, x, y, size, o = {}) {
  ctx.font = `${o.weight || 500} ${Math.max(6, size)}px "JetBrains Mono", "Quantico", monospace`;
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.base || 'middle';
  ctx.fillStyle = o.color || PLATE_COLORS.text;
  if (o.maxW) ctx.fillText(text, x, y, o.maxW); else ctx.fillText(text, x, y);
}

export const RECTS = Object.freeze({ ...HEAT_RECTS });

/** A card's slab: fill, hairline rim (amber when lit). Returns its box in pixels. */
export function slab(ctx, o, { hw, hh }, tone = '#2a2620') {
  const x0 = o.x - hw * o.sc; const y0 = o.y - hh * o.sc; const w = hw * 2 * o.sc; const h = hh * 2 * o.sc;
  ctx.fillStyle = tone; ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = o.lit ? AMBER : DUST; ctx.lineWidth = o.lit ? 2 : 1;
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1); ctx.lineWidth = 1;
  return { x0, y0, w, h };
}

export function paintPiece(ctx, p, state, o) {
  const def = pieceDef(p.kind);
  if (def?.paint) { def.paint(ctx, p, state, o); return true; }
  return heatPiece(ctx, p, state, o);
}

export function faceKey(p, state) {
  const def = pieceDef(p.kind);
  if (def?.faceKey) return def.faceKey(p, state);
  return heatFaceKey(p, state);
}

/** A fixture's frame in fixture units: `x(d)` and `y(d)` are pixels at `d` units from its left and top edge. */
export const frameOf = b => ({
  x: d => b.X(b.lay.box.x0 + d),
  y: d => b.Y(b.lay.box.y0 + d),
  len: d => d * b.sc,
  size: (k, min = 6.5) => Math.max(min, k * b.sc)
});

export const topOf = (f, lay) => (lay.dials.length ? lay.dials.reduce((a, d) => Math.max(a, d.y), 0) - lay.box.y0 + 3.6 : 10);

export function paintFixture(ctx, f, state, b) {
  const h = fixtureHandler(f.kind);
  if (h?.paint) return h.paint(ctx, f, state, b);
  return heatFixture(ctx, f, state, b);
}

export { contentTop };
