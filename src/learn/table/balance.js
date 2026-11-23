/**
 * balance.js — A row of pieces stands in the middle of the room it has, not against one side of it.
 *
 * Pure, no DOM, no THREE. Many tables were drawn with their loose pieces packed from the left edge (x = 13, 40, 67, ...)
 * whatever the width of the table, so the row stops two thirds of the way across and the rest of its line is bare plate.
 * `balanceRows` finds each such row (two or more loose pieces at one height, or a block of such rows stacked one under
 * the other), measures the bare table to its left and to its right on its own line (up to the next thing on that line,
 * or the edge of what is on the table), and slides it sideways until the two are equal. Only sideways, and only inside
 * that bare run, so it can never meet anything it did not already clear.
 *
 * It leaves a row alone when:
 *   - the two sides already differ by less than `SLACK`;
 *   - a piece stands on a fixture (a sample on an instrument), or in a zone;
 *   - two of its pieces are lined up under or over a zone or fixture (a middle on that zone's middle): the table was
 *     drawn in columns, and the column is the point.
 * A row whose pieces touch is opened out to `SPACE` between them when its run has the room. (A table is never made
 * deeper here: the built table frames what is on it, and a deeper one slides its far words under the bench's back rim.)
 * A stage opts out with `table.layout: 'as-drawn'`, as it does from `near.js`.
 * `createTable` calls this after the near swap, so the drawn (`table2d.js`) and the built (`table3d.js`) table agree.
 */

import { SIZES, rectOf } from './snap.js';
import { foePadOf, captionRect } from './layout.js';
import { pieceRect } from './audit.js';
import { occupied } from './notes.js';
import { radiusOf } from './kits/registry.js';

/** The least difference, in table units, between the bare table on a row's two sides that is worth moving it for. */
const SLACK = 12;
/** The gap, in table units, opened between neighbouring pieces of a row that touch. */
const SPACE = 2.5;
/** How far two rows of one block may stand apart, top to bottom, in table units. */
const STACK = 5;
/** Within this, in table units, a piece's middle is lined up with a zone's. */
const ALIGN = 1.5;

const hits = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

/** What a loose piece takes on the table: its body, its round reach, and its caption. */
function takes(kit, p) {
  const r = pieceRect(kit, p);
  const reach = radiusOf(kit, p);
  const out = [r, { x0: p.at.x - reach, x1: p.at.x + reach, y0: p.at.y - reach, y1: p.at.y + reach }];
  if (p.caption) out.push(captionRect(kit, p));
  return out;
}

/** The rows to move, as blocks: `[{pieces, rects}]`. */
function blocks(state, kit) {
  const fixtures = Object.values(state.fixtures || {}).map(f => rectOf(f, SIZES.fixture));
  const loose = Object.values(state.pieces).filter(p => !p.zone && !p.hidden && !p.fixed &&
    !fixtures.some(f => hits(f, pieceRect(kit, p))));
  const rows = new Map();
  for (const p of loose) {
    const k = Math.round(p.at.y);
    if (!rows.has(k)) rows.set(k, []);
    rows.get(k).push(p);
  }
  const list = [...rows.values()].filter(ps => ps.length >= 2).map(ps => {
    const rects = ps.flatMap(p => takes(kit, p));
    const box = rects.reduce((a, r) => ({ x0: Math.min(a.x0, r.x0), x1: Math.max(a.x1, r.x1), y0: Math.min(a.y0, r.y0), y1: Math.max(a.y1, r.y1) }),
      { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity });
    return { pieces: ps, rects, box };
  }).sort((a, b) => a.box.y0 - b.box.y0);
  // Rows stacked one under the other, across the same stretch of table, move as one: a grid stays a grid.
  const out = [];
  for (const row of list) {
    const last = out[out.length - 1];
    if (last && row.box.y0 - last.box.y1 <= STACK && row.box.x0 < last.box.x1 && last.box.x0 < row.box.x1) {
      last.pieces.push(...row.pieces);
      last.rects.push(...row.rects);
      last.box = { x0: Math.min(last.box.x0, row.box.x0), x1: Math.max(last.box.x1, row.box.x1), y0: last.box.y0, y1: Math.max(last.box.y1, row.box.y1) };
    } else out.push({ ...row, pieces: [...row.pieces], rects: [...row.rects] });
  }
  return out;
}

/** The middles of every zone and fixture, across the table: a piece lined up on one is in a drawn column. */
function columns(state) {
  const out = [];
  const add = r => out.push((r.x0 + r.x1) / 2);
  for (const t of Object.values(state.zones.trays)) add(rectOf(t, SIZES.tray));
  for (const t of Object.values(state.zones.slots)) add(rectOf(t, SIZES.slot));
  for (const t of Object.values(state.zones.containers)) add(rectOf(t, SIZES.container));
  for (const f of Object.values(state.fixtures || {})) add(rectOf(f, SIZES.fixture));
  return out;
}

/** Centre the lopsided rows of a table's loose pieces in their bare run, in place. Returns how many blocks moved. */
export function balanceRows(state, kit) {
  const cols = columns(state);
  let moved = 0;
  for (const block of blocks(state, kit)) {
    // Two pieces on zones' middles is a drawn column; one may be a coincidence.
    if (block.pieces.filter(p => cols.some(c => Math.abs(c - p.at.x) <= ALIGN)).length >= 2) continue;
    // Everything else on the table, this block left out.
    const mine = new Set(block.pieces.map(p => p.id));
    const others = occupied({ ...state, pieces: Object.fromEntries(Object.entries(state.pieces).map(([id, p]) => [id, mine.has(id) ? { ...p, hidden: true } : p])) }, kit);
    for (const p of Object.values(state.pieces)) if (p.zone && !p.hidden) others.push(pieceRect(kit, p));
    if (state.foe) others.push(foePadOf(state.bounds).rect);
    const { box } = block;
    const level = others.filter(b => b.y0 < box.y1 && box.y0 < b.y1);
    // Something already across the row: it is not a row standing on bare table.
    if (level.some(b => b.x0 < box.x1 && box.x0 < b.x1)) continue;
    // The edges of what is on the table bound the run where nothing on the row's line does.
    const span = others.concat(block.rects).reduce((a, r) => ({ x0: Math.min(a.x0, r.x0), x1: Math.max(a.x1, r.x1) }), { x0: Infinity, x1: -Infinity });
    const left = level.filter(b => b.x1 <= box.x0).reduce((m, b) => Math.max(m, b.x1), Math.max(1, span.x0));
    const right = level.filter(b => b.x0 >= box.x1).reduce((m, b) => Math.min(m, b.x0), Math.min(state.bounds.w - 1, span.x1));
    const freeL = box.x0 - left;
    const freeR = right - box.x1;
    // A single row whose pieces touch is opened out to `SPACE` between them first, where its run has the room for it.
    const shifts = new Map(block.pieces.map(p => [p.id, 0]));
    let width = box.x1 - box.x0;
    const single = new Set(block.pieces.map(p => Math.round(p.at.y))).size === 1;
    if (single) {
      const order = [...block.pieces].sort((a, b) => a.at.x - b.at.x);
      const bodies = order.map(p => pieceRect(kit, p));
      let add = 0;
      for (let i = 1; i < order.length; i++) {
        add += Math.max(0, SPACE - (bodies[i].x0 - bodies[i - 1].x1));
        shifts.set(order[i].id, add);
      }
      if (add > 0 && add <= freeL + freeR - SLACK) width += add;
      else for (const p of order) shifts.set(p.id, 0);
    }
    const grown = width - (box.x1 - box.x0);
    if (Math.abs(freeL - freeR) < SLACK && !grown) continue;
    // Centred in the run: what is left of it after the row's (opened) width, split evenly.
    const dx = Math.round(((freeL + freeR - grown) / 2 - freeL) * 100) / 100;
    for (const p of block.pieces) {
      const d = dx + shifts.get(p.id);
      // Its home goes with it when it is the place it starts (a piece put back goes to where it stood).
      if (Math.abs(p.home.x - p.at.x) < 0.01 && Math.abs(p.home.y - p.at.y) < 0.01) p.home = { ...p.home, x: Math.round((p.home.x + d) * 100) / 100 };
      p.at = { ...p.at, x: Math.round((p.at.x + d) * 100) / 100 };
    }
    moved++;
  }
  return moved;
}
