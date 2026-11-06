/**
 * kits/cell-room.js — finds empty table area for a mechanism view when the table may not grow (its pieces already sit at the phone floor in
 * both width and depth). Builds the stage's table state, collects every rectangle the layout audit knows (zones and their labels, fixtures,
 * pieces and captions, notes, the recorder strip, and the foe's corner on a boss table), and returns the largest empty rectangle that is wide
 * enough to read. Pure; no DOM.
 */
import { createTable } from '../model.js';
import { getKit } from './registry.js';
import { SIZES, rectOf } from '../snap.js';
import { labelRects, noteRect, captionRect, foePadOf } from '../layout.js';
import { pieceRect } from '../audit.js';

const MARGIN = 1.6;

export function occupied(state, kit, { foe = false } = {}) {
  const out = [];
  const add = r => out.push(r);
  for (const t of Object.values(state.zones.trays)) { add(rectOf(t, SIZES.tray)); labelRects(state, 'tray', t).forEach(add); }
  for (const t of Object.values(state.zones.slots)) { add(rectOf(t, SIZES.slot)); labelRects(state, 'slot', t).forEach(add); }
  for (const t of Object.values(state.zones.containers)) { add(rectOf(t, SIZES.container)); labelRects(state, 'container', t).forEach(add); }
  if (state.zones.rail) { add(rectOf(state.zones.rail, SIZES.rail)); labelRects(state, 'rail', state.zones.rail).forEach(add); }
  for (const f of Object.values(state.fixtures)) add(rectOf(f, SIZES.fixture));
  for (const f of Object.values(state.fetch || {})) if (f.at) add(rectOf(f, SIZES.site));
  add(rectOf(state.recorder.box, { w: 30, h: 18 }));
  for (const n of state.notes || []) add(noteRect(n));
  for (const p of Object.values(state.pieces)) { if (p.hidden) continue; add(pieceRect(kit, p)); if (p.caption) add(captionRect(kit, p)); }
  if (foe) add(foePadOf(state.bounds).rect);
  return out;
}

/** The largest empty rectangle (table units) at least `minW` by `minH`, no wider than `maxW` and no taller than `maxH`, or null. */
export function freeRect(spec, { minW = 54, minH = 24, maxW = 150, maxH = 54, foe = false } = {}) {
  const state = createTable(spec, 'room');
  const kit = getKit(state.kit);
  const W = Math.floor(state.bounds.w); const H = Math.floor(state.bounds.h);
  const blocked = Array.from({ length: H + 1 }, () => new Uint8Array(W + 1));
  for (const r of occupied(state, kit, { foe })) {
    for (let y = Math.max(0, Math.floor(r.y0 - MARGIN)); y <= Math.min(H, Math.ceil(r.y1 + MARGIN)); y++) {
      for (let x = Math.max(0, Math.floor(r.x0 - MARGIN)); x <= Math.min(W, Math.ceil(r.x1 + MARGIN)); x++) blocked[y][x] = 1;
    }
  }
  // prefix sums
  const P = Array.from({ length: H + 2 }, () => new Int32Array(W + 2));
  for (let y = 0; y <= H; y++) for (let x = 0; x <= W; x++) P[y + 1][x + 1] = blocked[y][x] + P[y][x + 1] + P[y + 1][x] - P[y][x];
  const sum = (x0, y0, x1, y1) => P[y1][x1] - P[y0][x1] - P[y1][x0] + P[y0][x0];
  let best = null;
  for (let h = maxH; h >= minH; h -= 2) {
    for (let y0 = 0; y0 + h <= H; y0++) {
      for (let x0 = 0; x0 < W; x0++) {
        for (let w = Math.min(maxW, W - x0); w >= minW; w -= 2) {
          if (w / h > 4.6) continue;
          if (sum(x0, y0, x0 + w, y0 + h) === 0) {
            if (!best || w * h > best.w * best.h) best = { x0, y0, w, h };
            break;
          }
        }
      }
    }
  }
  return best;
}
