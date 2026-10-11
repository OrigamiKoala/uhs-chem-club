/**
 * boxrack.js — The box rack, Lanternfall's instrument for where electrons sit.
 *
 * Orbital boxes laid out on an energy ladder, one row per subshell, higher
 * energy higher up. Each box takes up to two electrons, placed TWO-TAP, NEVER BY
 * DRAG: pick Up, Down or Remove from the tray, then tap a box. (A drag across
 * small targets is the gesture this audience cannot make, which is why the
 * catalogue board is two taps too.) The rack enforces the one rule a box has —
 * at most one electron of each spin — and says nothing else: it never lectures,
 * and it never tells a player an arrangement is wrong. What it does is READ it.
 *
 * WHAT THE RACK READS, always on the plate: electrons placed, electrons standing
 * alone in a box, and the arrangement written out row by row. A `Collapse Core`
 * key shortens the writing by folding the noble-gas rows away.
 *
 * THE MAGNET MEASURES THE SAMPLE, NOT THE PLAYER. `electrons.MEASURED` holds the
 * number of unpaired electrons in each real sample, found by experiment. The
 * quest asks the bench for it with `measured(id)`; it never depends on what has
 * been placed. That is what makes chromium a discovery: the arrangement the
 * ladder suggests reads four unpaired, and the magnet says six.
 *
 * Layouts:
 *   atomic   1s up to 4p with 4s set BELOW 3d (and 4f/5d/6p on request)
 *   address  rows grouped by n, each box carrying its m_l and each electron its m_s
 *   molecular  two atoms' boxes in two columns and the boxes they make between them
 *              (Ligar's bench nine); `order` picks which side-to-side / end-on pair
 *              is lower, and `combined: false` shows the atoms before they join
 *
 * Heads: `rack` (interactive) and `strip` (a read-only ladder of bars, one
 * element per plate, for a stage that asks about many at once).
 *
 * Aesthetic contract (CLAUDE.md §4, §8): phosphor arrows in milled boxes on a
 * dark plate. Spin is told by the direction of the arrow and a label, never by
 * colour.
 */

import { PlateBench, PLATE_COLORS, plateText, raster, aperture } from './plates.js';
import {
  rowsMO, placeMO, removeMO, readMO, boxKeyMO, DIATOMICS
} from './mo.js';
import {
  LADDER, boxesOf, capacityOf, boxKey, placeElectron, removeElectron, readRack, rackFor,
  groundConfig, symbolOf, zOf, nameOf, shortString, configString, MEASURED, mlOf, fmtMl,
  rowOf, sup
} from './electrons.js';

export { readRack, rackFor, MEASURED };

/** The rows a layout shows, bottom (lowest energy) first. */
export function rowsFor(item) {
  const ids = item.rows || ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p'];
  return ids.map(id => rowOf(id));
}

function drawArrow(ctx, cx, cy, size, up, color) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.5, size * 0.09);
  const dir = up ? -1 : 1;
  const h = size * 0.74;
  ctx.beginPath();
  ctx.moveTo(cx, cy - dir * h / 2);
  ctx.lineTo(cx, cy + dir * h / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - dir * h / 2);
  ctx.lineTo(cx - size * 0.2, cy - dir * h / 2 + dir * size * 0.28);
  ctx.lineTo(cx + size * 0.2, cy - dir * h / 2 + dir * size * 0.28);
  ctx.closePath();
  ctx.fill();
}

const HAND_LABEL = { u: 'UP', d: 'DOWN', x: 'REMOVE' };

function drawRack(ctx, w, h, item, cfg, o) {
  const rows = rowsFor(item);
  const rack = item.rack;
  const read = readRack(rack);
  const small = Math.max(9, Math.min(h * 0.04, w * 0.034));
  const hits = [];
  const address = item.layout === 'address';

  // ---- the reading, always on the plate ----
  const top = small * 1.6;
  plateText(ctx, `PLACED ${read.total}`, 8, top, { size: small * 1.15, color: PLATE_COLORS.phosphor, weight: 700 });
  plateText(ctx, `ALONE IN A BOX ${read.unpaired}`, w - 8, top, { align: 'right', size: small * 1.15, color: PLATE_COLORS.phosphor, weight: 700 });
  const written = cfg.core ? read.short : read.config;
  plateText(ctx, written || 'NOTHING PLACED', w / 2, top + small * 1.6, {
    align: 'center', size: small * 1.25, color: written ? PLATE_COLORS.dust : PLATE_COLORS.dim, weight: 600
  });

  // ---- the ladder ----
  const trayH = small * 3.1;
  const ladderTop = top + small * 3.0;
  const ladderBottom = h - trayH - 6;
  const n = rows.length;
  const rowH = Math.min((ladderBottom - ladderTop) / n, small * 3.6);
  const boxS = Math.min(rowH * 0.82, (w - 70) / 7.5, 36);
  const left = 44;
  const lastRowY = ladderBottom;

  // Energy arrow up the left edge.
  ctx.strokeStyle = PLATE_COLORS.dim;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(14, ladderBottom - 2); ctx.lineTo(14, ladderTop + 4);
  ctx.moveTo(14, ladderTop); ctx.lineTo(10, ladderTop + 7); ctx.lineTo(18, ladderTop + 7); ctx.closePath();
  ctx.stroke();
  plateText(ctx, 'ENERGY', 14, ladderTop - 2, { align: 'center', size: small * 0.75, color: PLATE_COLORS.dim });

  rows.forEach((row, ri) => {
    const cy = lastRowY - ri * rowH - rowH / 2;
    const show = cfg.show || { n: true, l: true, ml: true, ms: true };
    const label = address
      ? [show.n ? `n=${row.n}` : '', show.l ? `l=${row.l}` : ''].filter(Boolean).join(' ')
      : row.id;
    plateText(ctx, label, address ? 20 : 24, cy + small * 0.35, { size: small, color: PLATE_COLORS.dim });
    const boxes = boxesOf(row.l);
    for (let i = 0; i < boxes; i++) {
      const bx = left + (address ? 24 : 0) + i * (boxS + 5);
      const by = cy - boxS / 2;
      const key = boxKey(row.id, i);
      const here = rack[key] || '';
      const pre = item.prefill && item.locked ? (item.prefill[key] || '') : '';
      ctx.fillStyle = '#0a0908';
      ctx.fillRect(bx, by, boxS, boxS);
      ctx.strokeStyle = here ? PLATE_COLORS.steel : PLATE_COLORS.rim;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx + 0.5, by + 0.5, boxS - 1, boxS - 1);
      // Up arrow on the left of the box, down on the right: the spin is the direction.
      for (const spin of ['u', 'd']) {
        if (!here.includes(spin)) continue;
        const ax = spin === 'u' ? bx + boxS * 0.3 : bx + boxS * 0.7;
        const dim = pre.includes(spin);
        drawArrow(ctx, ax, cy, boxS * 0.8, spin === 'u', dim ? PLATE_COLORS.dim : PLATE_COLORS.phosphor);
        if (address && show.ms) plateText(ctx, spin === 'u' ? '+½' : '-½', ax, by + boxS + small * 0.9, { align: 'center', size: small * 0.72, color: PLATE_COLORS.dim });
      }
      if (address && show.ml) {
        plateText(ctx, `ml ${fmtMl(mlOf(row.id, i))}`, bx + boxS / 2, by - 3, { align: 'center', size: small * 0.72, color: PLATE_COLORS.dim });
      }
      hits.push({ key: 'box', row: row.id, idx: i, x0: bx, y0: by, x1: bx + boxS, y1: by + boxS });
    }
    // The cloud this row's electrons make, drawn to scale beside it: the larger
    // the first number, the farther out it reaches.
    if (address && cfg.clouds) {
      ctx.strokeStyle = PLATE_COLORS.dim;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(w - 22, cy, Math.min(rowH * 0.42, 3 + row.n * 5 + (row.l === 1 ? 2 : 0)), 0, Math.PI * 2);
      ctx.stroke();
    }
    if (item.marks?.[row.id]) {
      plateText(ctx, item.marks[row.id], w - 8, cy + small * 0.35, { align: 'right', size: small, color: PLATE_COLORS.amber });
    }
  });

  // ---- the tray: pick what the next tap does ----
  const hand = cfg.hand;
  const chips = ['u', 'd', 'x'];
  const cw = (w - 16 - 12) / 3;
  chips.forEach((c, i) => {
    const x = 8 + i * (cw + 6);
    const y = h - trayH + 2;
    const on = hand === c;
    ctx.fillStyle = on ? '#2a2c1f' : '#16140f';
    ctx.fillRect(x, y, cw, trayH - 6);
    ctx.strokeStyle = on ? PLATE_COLORS.phosphor : PLATE_COLORS.rim;
    ctx.lineWidth = on ? 2 : 1;
    ctx.strokeRect(x + 0.5, y + 0.5, cw - 1, trayH - 7);
    if (c !== 'x') drawArrow(ctx, x + cw * 0.22, y + (trayH - 6) / 2, small * 2.2, c === 'u', on ? PLATE_COLORS.phosphor : PLATE_COLORS.dust);
    plateText(ctx, HAND_LABEL[c], x + cw * (c === 'x' ? 0.5 : 0.62), y + (trayH - 6) / 2 + small * 0.35, {
      align: 'center', size: small * 1.05, color: on ? PLATE_COLORS.phosphor : PLATE_COLORS.dust, weight: 700
    });
    hits.push({ key: 'hand', hand: c, x0: x, y0: y, x1: x + cw, y1: y + trayH - 6 });
  });
  return hits;
}


/** The molecular layout: the atoms' boxes at the sides, the boxes they make between them. */
function drawMolecular(ctx, w, h, item, cfg) {
  const rows = rowsMO(item.order);
  const rack = item.rack;
  const read = readMO(item.order, rack);
  const small = Math.max(9, Math.min(h * 0.04, w * 0.034));
  const hits = [];
  const label = item.molLabel || '';

  plateText(ctx, `PLACED ${read.total}`, 8, small * 1.6, { size: small * 1.15, color: PLATE_COLORS.phosphor, weight: 700 });
  plateText(ctx, `ALONE IN A BOX ${read.unpaired}`, w - 8, small * 1.6, { align: 'right', size: small * 1.15, color: PLATE_COLORS.phosphor, weight: 700 });
  const show = cfg.show || {};
  if (item.combined && show.counts) {
    plateText(ctx, `LOWER ${read.bonding}   UPPER ${read.anti}`, w / 2, small * 3.2, { align: 'center', size: small * 1.1, color: PLATE_COLORS.dust, weight: 600 });
  } else if (label) {
    plateText(ctx, label, w / 2, small * 3.2, { align: 'center', size: small * 1.3, color: PLATE_COLORS.dust, weight: 700 });
  }

  const trayH = small * 3.1;
  const top = small * 4.6;
  const bottom = h - trayH - 6;
  const n = rows.length;
  const rowH = Math.min((bottom - top) / n, small * 3.9);
  const boxS = Math.min(rowH * 0.8, (w - 120) / 12, 30);
  const yOf = ri => bottom - ri * rowH - rowH / 2;
  const midX = w / 2;

  // Energy arrow up the left edge.
  ctx.strokeStyle = PLATE_COLORS.dim; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(12, bottom - 2); ctx.lineTo(12, top + 4); ctx.moveTo(12, top); ctx.lineTo(8, top + 7); ctx.lineTo(16, top + 7); ctx.closePath(); ctx.stroke();
  plateText(ctx, 'ENERGY', 12, top - 2, { align: 'center', size: small * 0.75, color: PLATE_COLORS.dim });

  // The atoms' own boxes, at each side.
  const aoRows = item.order === '1s' ? [{ y: (yOf(0) + yOf(1)) / 2, boxes: 1, name: '1s' }]
    : [{ y: (yOf(0) + yOf(1)) / 2, boxes: 1, name: '2s' }, { y: (yOf(3) + yOf(4)) / 2, boxes: 3, name: '2p' }];
  for (const side of [-1, 1]) {
    const cx = midX + side * w * 0.36;
    plateText(ctx, item.atomLabel || '', cx, bottom + small * 1.4, { align: 'center', size: small, color: PLATE_COLORS.dim });
    for (const ao of aoRows) {
      for (let b = 0; b < ao.boxes; b++) {
        const x = cx + (b - (ao.boxes - 1) / 2) * (boxS * 0.9 + 3) - boxS * 0.45;
        ctx.fillStyle = '#0a0908';
        ctx.fillRect(x, ao.y - boxS * 0.45, boxS * 0.9, boxS * 0.9);
        ctx.strokeStyle = PLATE_COLORS.rim; ctx.lineWidth = 1.2;
        ctx.strokeRect(x + 0.5, ao.y - boxS * 0.45 + 0.5, boxS * 0.9 - 1, boxS * 0.9 - 1);
      }
      plateText(ctx, ao.name, cx - side * (boxS * 0.9 * ao.boxes / 2 + 12), ao.y + small * 0.35, { align: 'center', size: small * 0.9, color: PLATE_COLORS.dim });
    }
  }

  if (!item.combined) return drawTray(ctx, w, h, small, trayH, cfg, hits);

  // The boxes between them, lowest energy at the bottom, with the lines to the atoms they came from.
  ctx.strokeStyle = PLATE_COLORS.rim; ctx.lineWidth = 1;
  ctx.setLineDash?.([3, 4]);
  rows.forEach((row, ri) => {
    const y = yOf(ri);
    const fromAO = aoRows.reduce((best, a) => (!best || Math.abs(a.y - y) < Math.abs(best.y - y) ? a : best), null);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(midX + side * w * 0.36 - side * boxS * 0.9, fromAO.y);
      ctx.lineTo(midX + side * ((row.boxes * (boxS + 4)) / 2 + 6), y);
      ctx.stroke();
    }
  });
  ctx.setLineDash?.([]);

  rows.forEach((row, ri) => {
    const cy = yOf(ri);
    plateText(ctx, row.label, midX - (row.boxes * (boxS + 4)) / 2 - 12, cy + small * 0.35, { align: 'right', size: small * 1.05, color: row.anti ? PLATE_COLORS.dust : PLATE_COLORS.phosphor, weight: 700 });
    for (let i = 0; i < row.boxes; i++) {
      const bx = midX - (row.boxes * (boxS + 4)) / 2 + i * (boxS + 4);
      const by = cy - boxS / 2;
      const here = rack[boxKeyMO(row.id, i)] || '';
      ctx.fillStyle = '#0a0908';
      ctx.fillRect(bx, by, boxS, boxS);
      ctx.strokeStyle = here ? PLATE_COLORS.steel : PLATE_COLORS.rim;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx + 0.5, by + 0.5, boxS - 1, boxS - 1);
      for (const spin of ['u', 'd']) {
        if (!here.includes(spin)) continue;
        drawArrow(ctx, spin === 'u' ? bx + boxS * 0.3 : bx + boxS * 0.7, cy, boxS * 0.8, spin === 'u', PLATE_COLORS.phosphor);
      }
      hits.push({ key: 'box', row: row.id, idx: i, x0: bx, y0: by, x1: bx + boxS, y1: by + boxS });
    }
  });
  return drawTray(ctx, w, h, small, trayH, cfg, hits);
}

function drawTray(ctx, w, h, small, trayH, cfg, hits) {
  const hand = cfg.hand;
  const cw = (w - 16 - 12) / 3;
  ['u', 'd', 'x'].forEach((c, i) => {
    const x = 8 + i * (cw + 6);
    const y = h - trayH + 2;
    const on = hand === c;
    ctx.fillStyle = on ? '#2a2c1f' : '#16140f';
    ctx.fillRect(x, y, cw, trayH - 6);
    ctx.strokeStyle = on ? PLATE_COLORS.phosphor : PLATE_COLORS.rim;
    ctx.lineWidth = on ? 2 : 1;
    ctx.strokeRect(x + 0.5, y + 0.5, cw - 1, trayH - 7);
    if (c !== 'x') drawArrow(ctx, x + cw * 0.22, y + (trayH - 6) / 2, small * 2.2, c === 'u', on ? PLATE_COLORS.phosphor : PLATE_COLORS.dust);
    plateText(ctx, HAND_LABEL[c], x + cw * (c === 'x' ? 0.5 : 0.62), y + (trayH - 6) / 2 + small * 0.35, {
      align: 'center', size: small * 1.05, color: on ? PLATE_COLORS.phosphor : PLATE_COLORS.dust, weight: 700
    });
    hits.push({ key: 'hand', hand: c, x0: x, y0: y, x1: x + cw, y1: y + trayH - 6 });
  });
  return hits;
}

/** The strip head: one element's ladder as bars, with the row its last electron went into lit. */
function drawStrip(ctx, w, h, item, cfg) {
  const z = zOf(item.sym);
  const counts = groundConfig(z);
  const rows = LADDER;
  const small = Math.max(8, Math.min(h * 0.05, w * 0.04));
  plateText(ctx, `${item.sym}`, 8, small * 1.7, { size: small * 1.9, color: PLATE_COLORS.dust, weight: 700 });
  plateText(ctx, nameOf(item.sym).toUpperCase(), w - 8, small * 1.6, { align: 'right', size: small, color: PLATE_COLORS.dim });
  let last = null;
  for (const row of rows) if (counts[row.id]) last = row.id;
  const top = small * 3;
  const rowH = (h - top - 6) / rows.length;
  const barX = 40;
  const barMax = w - barX - 30;
  rows.forEach((row, ri) => {
    const y = h - 6 - (ri + 1) * rowH;
    const cap = capacityOf(row.id);
    const n = counts[row.id] || 0;
    plateText(ctx, row.id, barX - 6, y + rowH * 0.78, { align: 'right', size: Math.min(small, rowH * 0.8), color: PLATE_COLORS.dim });
    const cellW = barMax / 14;
    for (let c = 0; c < cap / 2; c++) {
      const x = barX + c * cellW * 2;
      const inRow = Math.min(2, Math.max(0, n - c * 2));
      ctx.fillStyle = '#0a0908';
      ctx.fillRect(x, y + 1, cellW * 1.8, rowH - 2);
      ctx.strokeStyle = PLATE_COLORS.rim;
      ctx.strokeRect(x + 0.5, y + 1.5, cellW * 1.8 - 1, rowH - 3);
      if (inRow) {
        ctx.fillStyle = row.id === last ? PLATE_COLORS.amber : PLATE_COLORS.phosphor;
        ctx.fillRect(x + 1, y + 2, (cellW * 1.8 - 2) * (inRow / 2), rowH - 4);
      }
    }
  });
  return [];
}

export class BoxRack extends PlateBench {
  /** @param {{onProbe?: Function, onSelect?: Function}} opts */
  constructor(host, opts = {}) {
    super(host, opts);
    this.cfg = { hand: null, core: false };
  }

  prepare(item) {
    const it = { ...item, rack: { ...(item.prefill || {}) } };
    if (item.layout === 'molecular') it.combined = item.combined ?? true;
    if (item.fillGround && !item.prefill) it.rack = rackFor(item.z ?? zOf(item.sym || item.sample));
    return it;
  }

  apertureClass(item) { return item.head === 'strip' ? 'rack-aperture rack-strip' : 'rack-aperture'; }

  /** Join the two atoms' boxes into the molecule's (the molecular layout). */
  combine(id) {
    const item = this.itemFor(id);
    if (!item) return;
    item.combined = true;
    this.drawAll();
  }

  gridClass() { return 'rack-grid'; }

  /** Lay out the plates for a stage. */
  setPlates(items, cfg = {}) {
    this.cfg = { hand: null, core: false, ...cfg };
    super.setPlates(items);
  }

  /* ---- state ---- */

  rackOf(id) { return { ...(this.itemFor(id)?.rack || {}) }; }
  readOf(id) {
    const item = this.itemFor(id);
    if (item?.layout === 'molecular') return readMO(item.order, item.rack || {});
    return readRack(item?.rack || {});
  }

  /** What the magnet measures in the REAL sample on a plate. Never what was placed. */
  measured(id) {
    const item = this.itemFor(id);
    if (item?.mol) return DIATOMICS[item.mol]?.unpaired ?? null;
    return item?.sample ? (MEASURED[item.sample] ?? null) : null;
  }

  setHand(hand) { this.cfg.hand = hand; this.drawAll(); }
  setCore(on) { this.cfg.core = Boolean(on); this.drawAll(); }

  /** Back to what the stage handed over: the prefilled rows, and nothing else. */
  clear(id = null) {
    for (const item of this.items) {
      if (id && item.id !== id) continue;
      item.rack = { ...(item.prefill || {}) };
    }
    this.drawAll();
  }

  /** Place or remove one electron with the hand held. Returns what happened. */
  act(item, rowId, idx) {
    const hand = this.cfg.hand;
    if (!hand) return { action: 'refused', reason: 'Pick Up, Down or Remove from the tray first.' };
    if (item.layout === 'molecular') {
      if (!item.combined) return { action: 'refused', reason: 'The atoms have not joined yet.' };
      if (hand === 'x') {
        const r = removeMO(item.order, item.rack, rowId, idx);
        if (r.refused) return { action: 'refused', reason: r.refused };
        item.rack = r.rack;
        return { action: 'removed', rowId, idx };
      }
      const r = placeMO(item.order, item.rack, rowId, idx, hand);
      if (r.refused) return { action: 'refused', reason: r.refused, rowId, idx };
      item.rack = r.rack;
      return { action: 'placed', rowId, idx, spin: hand };
    }
    const key = boxKey(rowId, idx);
    if (hand === 'x') {
      const pre = item.locked ? (item.prefill?.[key] || '') : '';
      const here = item.rack[key] || '';
      if (pre && here.length <= pre.length) return { action: 'refused', reason: 'That electron is fixed in place on this stage.' };
      const r = removeElectron(item.rack, rowId, idx);
      if (r.refused) return { action: 'refused', reason: r.refused };
      item.rack = r.rack;
      return { action: 'removed', rowId, idx };
    }
    const r = placeElectron(item.rack, rowId, idx, hand);
    if (r.refused) return { action: 'refused', reason: r.refused, rowId, idx };
    item.rack = r.rack;
    return { action: 'placed', rowId, idx, spin: hand };
  }

  /** A tap on the picture. The tray picks the hand; a box takes or gives an electron. */
  press(item, hit) {
    if (!hit) return null;
    if (hit.key === 'hand') {
      this.cfg.hand = hit.hand;
      return { mark: {}, read: { kind: 'hand', hand: hit.hand } };
    }
    if (hit.key === 'box') {
      const res = this.act(item, hit.row, hit.idx);
      const reading = item.layout === 'molecular' ? readMO(item.order, item.rack) : readRack(item.rack);
      return { mark: {}, read: { kind: 'rack', plateId: item.id, ...res, rack: { ...item.rack }, reading } };
    }
    return null;
  }

  draw(ctx, w, h, item, o) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = PLATE_COLORS.bg;
    ctx.fillRect(0, 0, w, h);
    const hits = item.head === 'strip' ? drawStrip(ctx, w, h, item, this.cfg)
      : item.layout === 'molecular' ? drawMolecular(ctx, w, h, item, this.cfg)
        : drawRack(ctx, w, h, item, this.cfg, o);
    raster(ctx, w, h, o.sweep, 0, h);
    aperture(ctx, w, h);
    return hits;
  }

  tick() { return false; }
}

export { configString, shortString, symbolOf, sup };
