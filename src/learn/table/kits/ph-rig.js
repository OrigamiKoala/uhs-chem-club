/**
 * kits/ph-rig.js — the ratio rig and its tiles, registered on the ph kit (`ph-registry.js`). Verdigris's `q3-weak` (the weak-acid
 * constant) and every later bench that asks for a constant.
 *
 *   RIG   two rows of places, above and below a line, and a tile (`phtile`) for each quantity. For every column the rig prints the
 *         tiles above the line multiplied together over the tiles below, each taken at that column's value. A column is a flask (its
 *         species come from the planner, `ph-read.js` `speciesOf`) or a set of constants a stage gives. The rig prints ONLY the
 *         reading, never which arrangement is the one to look for, and prints a dash until a tile is laid.
 *   TILE  a tile naming one quantity: a species of the flask (`H`, `A`, `HA`, `OH`, `BH`, `B`) or a constant (`Ka`, `Kb`).
 *
 * The pans kit's rig (`pans-ratio.js`) reads the eqdata systems and cannot be fed an acid flask, so this one is its own; the shape
 * (a fixture whose places are slots, a tile in each) is the same. Every reading is `ph-read.js` `rigRead`, so the drawn and the built
 * table, and a scripted replay, show the same number.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { registerFixture, registerPiece } from './ph-registry.js';
import { slab, frameOf } from './matter-draw.js';
import { put, ionText } from './ph-flask.js';
import { rigRead, numText } from './ph-read.js';

const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const AMBER = PLATE_COLORS.amber;

export const TILE_PITCH = 19.5;
const SLOT = { w: 18, h: 10 };

function paintRig(ctx, f, state, b) {
  const F = frameOf(b);
  const r = rigRead(state, f.id);
  const p = f.props;
  const lw = p.lw;
  const lineY = f.size.h / 2 + 2.5;
  // The line between the rows, as long as the places are wide.
  const rowN = Math.max(p.top.length, p.bottom.length);
  ctx.strokeStyle = DUST; ctx.lineWidth = Math.max(1.4, F.len(0.3));
  ctx.beginPath(); ctx.moveTo(F.x(2), F.y(lineY)); ctx.lineTo(F.x(2 + rowN * TILE_PITCH), F.y(lineY)); ctx.stroke(); ctx.lineWidth = 1;
  const n = p.cols.length;
  const cw = (f.size.w - lw - 1.5) / n;
  for (let j = 0; j < n; j++) {
    const col = p.cols[j];
    const cx = lw + (j + 0.5) * cw;
    ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(lw + j * cw + 0.4), F.y(6.4), F.len(cw - 0.8), F.len(f.size.h - 7.8));
    ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(lw + j * cw + 0.4)) + 0.5, Math.round(F.y(6.4)) + 0.5, Math.round(F.len(cw - 0.8)), Math.round(F.len(f.size.h - 7.8)));
    put(ctx, ionText(col.title), F.x(cx), F.y(9.6), F.size(2.2, 6), { color: DUST, weight: 700, maxW: F.len(cw - 1.6) });
    (col.lines || []).forEach((ln, k) => put(ctx, ionText(ln), F.x(cx), F.y(13.2 + k * 3.3), F.size(2.0, 5.8), { color: DUST, maxW: F.len(cw - 1.6) }));
    const v = r.readings[j];
    if (r.laid) put(ctx, numText(v), F.x(cx), F.y(f.size.h - 7.4), F.size(4.2, 10), { color: AMBER, weight: 700, maxW: F.len(cw - 1.6) });
    else put(ctx, '—', F.x(cx), F.y(f.size.h - 7.4), F.size(4.2, 10), { color: DIM, weight: 700 });
  }
  put(ctx, 'reads', F.x(lw - 1.2), F.y(f.size.h - 7.4), F.size(2.0, 5.8), { align: 'right', color: DUST });
}

registerFixture('phrig', { paint: paintRig });

/**
 * A ratio rig. `cols` is `[{ flask: <fixture id> | values: {key: number}, title, lines? }]`, one column each; `top` and `bottom` are how
 * many places each row has. Returns the fixture and the slots (add the slots to the stage's `zones.slots`). Stand it under the flasks:
 * its columns share their pitch (`pitch`) and its left column (`lw`) holds the places.
 */
export function rigParts(id, at, { cols, top = 2, bottom = 2, pitch = 35, lw = null, h = 28, title = 'Expression board' } = {}) {
  const left = lw ?? Math.max(top, bottom) * TILE_PITCH + 3;
  const w = Math.round((left + cols.length * pitch + 1.5) * 10) / 10;
  const x0 = at.x - w / 2; const y0 = at.y - h / 2;
  const lineY = h / 2 + 2.5;
  const slot = (row, i) => ({ id: `${id}.${row}${i + 1}`, label: ' ', at: { x: x0 + 2 + SLOT.w / 2 + i * TILE_PITCH, y: y0 + (row === 't' ? lineY - 6.5 : lineY + 6.5) }, size: { ...SLOT } });
  const t = Array.from({ length: top }, (_, i) => slot('t', i));
  const bt = Array.from({ length: bottom }, (_, i) => slot('b', i));
  return {
    fixture: {
      id, kind: 'phrig', label: title, at: { ...at }, size: { w, h }, noRun: true,
      dials: { x: { min: 0, max: 1, step: 1, value: 0, label: 'Board' } },
      props: { hidden: ['x'], backdrop: true, lw: left, cols, top: t.map(s => s.id), bottom: bt.map(s => s.id) }
    },
    slots: [...t, ...bt],
    size: { w, h },
    lw: left
  };
}

/* ------------------------------------------------------------------ the tile */

const RECT_TILE = { hw: 8, hh: 4.6 };

function paintTile(ctx, p, state, o) {
  const box = slab(ctx, o, RECT_TILE, '#2a2620');
  const label = ionText(p.label);
  const size = Math.min(4.2 * o.sc, (box.w - 1.6 * o.sc) / (Math.max(2, label.length) * 0.6));
  put(ctx, label, o.x, o.y, Math.max(8, size), { weight: 700, maxW: box.w - 1.2 * o.sc });
}

registerPiece('phtile', {
  kind: { r: 8.4, rect: RECT_TILE, nojoin: true },
  paint: paintTile,
  faceKey: p => `phtile|${p.label}`,
  printed: p => ionText(p.label)
});

/** A tile for the quantity `key` (a species of the flask, or a constant), named `label` on its face. */
export const tile = (id, key, label, at, extra = {}) => ({ id, kind: 'phtile', label, at, props: { key }, ...extra });
