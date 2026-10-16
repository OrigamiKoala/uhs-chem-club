/**
 * table2d.js — The drawn tabletop: a top-down canvas of the table's state.
 *
 * At T1 to T3 (and for a player with 3D off) the bench is this: a canvas on a
 * plate showing the pieces, trays, rail, slots, containers and fixtures of a
 * `TableState` (`table/model.js`), with the recorder's strip in a corner and
 * the stage's tools as keys under it. The built tabletop (T0b) draws the same
 * state through the same reducer, so a stage grades identically on both.
 *
 * IT OWNS NO RULES. A press, a drag or a tap becomes one reducer action,
 * handed to `onAction`; the quest's runner applies it and hands the new state
 * back through `setState`. What a drop MEANS is `table/snap.js`; what a join
 * does is the kit. This file only paints and listens.
 *
 * INPUT. Drag is primary and two-tap always works (plan §2.2):
 *   - press a piece and move: it follows the pointer; on the rail the others
 *     slide apart to open the gap; release to drop it (`place` at a point);
 *   - tap a piece (`pick`), then tap where it goes (`place` to a named target):
 *     a tray, a slot, a container, a gap on the rail, another piece, or open
 *     table. Tapping the held piece puts it down.
 *   - a fixture's dial is dragged along its track; its Run key is tapped.
 *
 * Built on `PlateBench` (plates.js): the same raster, aperture, plate frame and
 * tick loop as every drawn instrument, with one plate holding the whole table.
 * Pieces are 28 px or more across at 375 px (their radius is in table units),
 * the canvas takes `touch-action: none` so a finger drags rather than scrolls,
 * and its keys (`.lq-tool`) keep `pointer-events: auto`.
 *
 * Aesthetic (SCOURED PLATE): phosphor and dust on a recessed plate, filament
 * not LED, amber only for the piece in the hand and the key that is laid.
 */

import { PlateBench, PLATE_COLORS, plateText, raster, aperture, lampMark } from './plates.js';
import { getKit, radiusOf } from '../table/kits/index.js';
import { SIZES, rectOf, railPositions } from '../table/snap.js';
import { lineOf, readY, plotUnits } from '../table/recorder.js';
import { fixtureLayout, pieceTargets, sitePlate } from '../table/layout.js';
import { TableGestures } from '../table/gestures.js';
import { TableKeys } from './table-keys.js';

export { fixtureLayout, lampMark };

const AMBER = PLATE_COLORS.amber;

/* ------------------------------------------------------------------
   THE PICTURE (pure over a 2D context, drawn in Node by verify:table)
   ------------------------------------------------------------------ */

/** Table units to pixels: the table is fitted into the plate and centred. */
export function fit(w, h, bounds) {
  const sc = Math.min(w / bounds.w, h / bounds.h);
  return { sc, ox: (w - bounds.w * sc) / 2, oy: (h - bounds.h * sc) / 2 };
}

/**
 * What a piece shows on its face right now: its label, a `x2` badge when scaled,
 * and whether it lies face down. A kit may say more (`kit.faceOf(piece, state)`);
 * the drawn and the built table both read this, so they cannot disagree.
 */
export function faceOf(kit, piece, state) {
  const own = kit.faceOf ? kit.faceOf(piece, state) : null;
  const scale = piece.props?.scale || 1;
  return {
    text: String(own?.text ?? piece.label ?? piece.id),
    badge: own?.badge ?? (scale > 1 ? `x${scale}` : ''),
    flipped: Boolean(own?.flipped ?? piece.props?.flipped)
  };
}

/**
 * Paint a table. `view` carries what is not the table's own state: the pieces'
 * eased positions (`shown`), the piece on the pointer (`drag`), the gap the
 * rail is holding open (`railGap`), the jar a pour starts from (`pourFrom`).
 *
 * The built table paints this same picture as the flat part of the plate and
 * builds the rest: `view.pieces === false` leaves the pieces to it,
 * `view.controls === false` the dials and Run keys, `view.sheet === false` the
 * paper strip. Zones, labels and jar levels are drawn once, here, for both.
 */
export function drawTable(ctx, w, h, state, view = {}) {
  ctx.fillStyle = PLATE_COLORS.bg;
  ctx.fillRect(0, 0, w, h);
  if (!state) return [];
  const kit = getKit(state.kit);
  const { sc, ox, oy } = fit(w, h, state.bounds);
  const X = x => ox + x * sc;
  const Y = y => oy + y * sc;
  const holding = state.carry.held;
  const showPieces = view.pieces !== false;
  const text = (t, x, y, o = {}) => plateText(ctx, t, X(x), Y(y), { size: Math.max(9, 2.6 * sc), ...o });

  /* zones */
  ctx.lineWidth = 1;
  const outline = (r, lit, dashed = true) => {
    ctx.setLineDash?.(dashed ? [4, 3] : []);
    ctx.strokeStyle = lit ? PLATE_COLORS.steel : PLATE_COLORS.rim;
    ctx.strokeRect(Math.round(X(r.x0)) + 0.5, Math.round(Y(r.y0)) + 0.5, Math.round(r.w * sc), Math.round(r.h * sc));
    ctx.setLineDash?.([]);
  };
  for (const t of Object.values(state.zones.trays)) {
    const r = rectOf(t, SIZES.tray);
    outline(r, Boolean(holding));
    text(t.label, r.x0 + 1.2, r.y0 - 1, { color: PLATE_COLORS.dim });
    if (t.cap != null) {
      const n = Object.values(state.pieces).filter(p => p.zone === `tray:${t.id}` && !p.hidden).length;
      text(`${n}/${t.cap}`, r.x1 - 1.2, r.y0 - 1, { align: 'right', color: n > t.cap ? AMBER : PLATE_COLORS.dim });
      if (n > t.cap) lampMark(ctx, X(r.x1) - 7, Y(r.y0) + 7, Math.max(10, 2.6 * sc));
    }
  }
  for (const c of Object.values(state.zones.containers)) {
    const r = rectOf(c, SIZES.container);
    outline(r, Boolean(holding) || view.pourFrom === c.id, false);
    const total = Object.values(c.contents).reduce((a, b) => a + b, 0);
    const cap = c.capacity || Math.max(total, 1);
    const level = Math.min(1, total / cap);
    ctx.fillStyle = PLATE_COLORS.dim;
    ctx.fillRect(X(r.x0) + 1, Y(r.y1) - level * r.h * sc, r.w * sc - 2, level * r.h * sc - 1);
    text(c.label, r.x0 + 1.2, r.y0 - 1, { color: PLATE_COLORS.dim });
    if (total > 0) text(String(Math.round(total * 100) / 100), r.x0 + r.w / 2, r.y0 + r.h / 2, { align: 'center', base: 'middle', color: PLATE_COLORS.text });
  }
  for (const s of Object.values(state.zones.slots)) {
    const r = rectOf(s, SIZES.slot);
    outline(r, Boolean(holding));
    if (s.label) text(s.label, r.x0 + r.w / 2, r.y1 + 3.4, { align: 'center', color: PLATE_COLORS.dim });
  }
  const rail = state.zones.rail;
  if (rail) {
    const r = rectOf(rail, SIZES.rail);
    ctx.strokeStyle = PLATE_COLORS.rim;
    ctx.beginPath();
    ctx.moveTo(X(r.x0), Y(rail.at.y) + 0.5);
    ctx.lineTo(X(r.x1), Y(rail.at.y) + 0.5);
    ctx.stroke();
    if (rail.first) text(rail.first, r.x0, r.y0 - 1, { color: PLATE_COLORS.dim });
    if (rail.last) text(rail.last, r.x1, r.y0 - 1, { align: 'right', color: PLATE_COLORS.dim });
    if (holding) {
      // The gaps a held piece can be tapped into: one under every place it could go.
      const n = rail.order.filter(o => o !== holding).length;
      ctx.strokeStyle = AMBER;
      for (const p of railPositions(rail, n + 1)) {
        ctx.beginPath();
        ctx.moveTo(X(p.x - 4), Y(rail.at.y + r.h / 2) + 3);
        ctx.lineTo(X(p.x + 4), Y(rail.at.y + r.h / 2) + 3);
        ctx.stroke();
      }
    }
  }

  /* the drawn site plates of the field points (T1 to T3) */
  if (view.sites !== false) {
    for (const f of Object.values(state.fetch)) {
      const r = sitePlate(f);
      if (!r || (typeof view.sites === 'function' && !view.sites(f.id))) continue;
      const waiting = Object.values(state.pieces).some(p => p.fetchFrom === f.id && p.hidden);
      outline(r, false, false);
      ctx.strokeStyle = waiting ? PLATE_COLORS.steel : PLATE_COLORS.rim;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(X(r.x0 + 2), Y(r.y0 + 4 + i * 2.2) + 0.5);
        ctx.lineTo(X(r.x1 - 9), Y(r.y0 + 4 + i * 2.2) + 0.5);
        ctx.stroke();
      }
      ctx.fillStyle = waiting ? AMBER : PLATE_COLORS.dim;
      ctx.beginPath();
      ctx.arc(X(r.x1 - 5.5), Y(r.y0 + 6.2), Math.max(3, 1.3 * sc), 0, Math.PI * 2);
      ctx.fill();
      text(f.label, r.x0 + 1.2, r.y1 - 1.6, { color: waiting ? PLATE_COLORS.dust : PLATE_COLORS.dim });
    }
  }

  /* fixtures */
  for (const f of Object.values(state.fixtures)) {
    const lay = fixtureLayout(f);
    outline(lay.box, false, false);
    text(f.label, lay.box.x0 + 1.5, lay.box.y0 + 3.6, { color: PLATE_COLORS.dust });
    // A kit paints what a fixture shows (a needle, a beam's path, a reading) in the box, flat:
    // the built table paints it into the plate's own picture, so the two cannot differ.
    kit.paintFixture?.(ctx, f, state, { x0: X(lay.box.x0), y0: Y(lay.box.y0), x1: X(lay.box.x1), y1: Y(lay.box.y1), sc, X, Y, lay });
    // A dial's name and where it stands are printed on the plate in both views; only its track and
    // knob are the drawn table's own (the built table stands a real knob on it).
    for (const d of lay.dials) {
      const dial = f.dials[d.name];
      const frac = dial.max === dial.min ? 0 : (dial.value - dial.min) / (dial.max - dial.min);
      if (view.controls !== false) {
        ctx.strokeStyle = PLATE_COLORS.steel;
        ctx.beginPath();
        ctx.moveTo(X(d.x0), Y(d.y));
        ctx.lineTo(X(d.x1), Y(d.y));
        ctx.stroke();
        ctx.fillStyle = PLATE_COLORS.dust;
        const kx = X(d.x0 + frac * (d.x1 - d.x0));
        ctx.fillRect(kx - 3, Y(d.y) - 5, 6, 10);
      }
      const shown = dial.labels ? dial.labels[Math.round((dial.value - dial.min) / (dial.step || 1))] ?? dial.value : dial.value;
      text(`${dial.label || d.name} ${shown}`, d.x0, d.y - 1.2, { color: PLATE_COLORS.dust, size: Math.max(9, 2.3 * sc) });
    }
    if (view.controls === false) continue;
    if (!lay.run) continue;
    ctx.strokeStyle = PLATE_COLORS.steel;
    ctx.strokeRect(Math.round(X(lay.run.x0)) + 0.5, Math.round(Y(lay.run.y0)) + 0.5, Math.round((lay.run.x1 - lay.run.x0) * sc), Math.round((lay.run.y1 - lay.run.y0) * sc));
    text(f.runLabel || 'Run', (lay.run.x0 + lay.run.x1) / 2, (lay.run.y0 + lay.run.y1) / 2, { align: 'center', base: 'middle', color: PLATE_COLORS.text });
  }

  /* the recorder's strip */
  if (view.sheet !== false) drawRecorder(ctx, state, X, Y, sc);
  if (!showPieces) { if (view.crt !== false) { raster(ctx, w, h); aperture(ctx, w, h); } return []; }

  /* joins, then pieces (the one on the pointer last) */
  const at = p => (view.drag?.id === p.id ? view.drag.at : (view.shown?.[p.id] || p.at));
  ctx.strokeStyle = PLATE_COLORS.dust;
  ctx.lineWidth = 3;
  for (const key of Object.keys(state.links)) {
    const [a, b] = key.split('|');
    const pa = state.pieces[a];
    const pb = state.pieces[b];
    if (!pa || !pb || pa.hidden || pb.hidden) continue;
    const A = at(pa);
    const B = at(pb);
    if (kit.paintLink?.(ctx, state.links[key], { a: pa, b: pb, ax: X(A.x), ay: Y(A.y), bx: X(B.x), by: Y(B.y), sc })) continue;
    ctx.beginPath();
    ctx.moveTo(X(A.x), Y(A.y));
    ctx.lineTo(X(B.x), Y(B.y));
    ctx.stroke();
  }
  ctx.lineWidth = 1;
  const order = Object.values(state.pieces).filter(p => !p.hidden);
  order.sort((p, q) => (view.drag?.id === p.id) - (view.drag?.id === q.id));
  for (const p of order) {
    const c = at(p);
    const r = radiusOf(kit, p) * sc;
    const lit = holding === p.id;
    // A kit paints its own pieces (an atom, a dish with the scope's picture on it) through the SAME
    // function the built table paints a piece's face with, so the two views cannot show different things.
    if (kit.paintPiece?.(ctx, p, state, { x: X(c.x), y: Y(c.y), r, lit, sc })) continue;
    const square = p.kind === 'card' || p.token;
    const face = faceOf(kit, p, state);
    const label = face.badge ? `${face.text} ${face.badge}` : face.text;
    ctx.fillStyle = p.token || face.flipped ? PLATE_COLORS.bg : PLATE_COLORS.steel;
    ctx.strokeStyle = lit ? AMBER : PLATE_COLORS.dust;
    ctx.lineWidth = lit ? 2 : 1;
    if (square) {
      const half = Math.max(r, (label.length * 3.1 + 8) / 2);
      ctx.fillRect(X(c.x) - half, Y(c.y) - r, half * 2, r * 2);
      ctx.strokeRect(X(c.x) - half + 0.5, Y(c.y) - r + 0.5, half * 2 - 1, r * 2 - 1);
    } else {
      ctx.beginPath();
      ctx.arc(X(c.x), Y(c.y), r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.lineWidth = 1;
    plateText(ctx, label, X(c.x), Y(c.y), { size: Math.max(9, Math.min(12, r * 0.7)), align: 'center', base: 'middle', color: lit ? AMBER : PLATE_COLORS.text });
  }

  raster(ctx, w, h);
  aperture(ctx, w, h);
  return [];
}

function drawRecorder(ctx, state, X, Y, sc) {
  const rec = state.recorder;
  if (!rec.rows.length) return;
  const pu = plotUnits(rec);
  const r = pu.r;
  ctx.strokeStyle = PLATE_COLORS.rim;
  ctx.strokeRect(Math.round(X(r.x0)) + 0.5, Math.round(Y(r.y0)) + 0.5, Math.round(r.w * sc), Math.round(r.h * sc));
  const px = x => X(pu.ux(x));
  const py = y => Y(pu.uy(y));
  const line = lineOf(rec);
  if (line) {
    ctx.strokeStyle = AMBER;
    ctx.beginPath();
    ctx.moveTo(px(pu.xlo), py(readY(line, pu.xlo)));
    ctx.lineTo(px(pu.xhi), py(readY(line, pu.xhi)));
    ctx.stroke();
  }
  ctx.fillStyle = PLATE_COLORS.dust;
  for (const row of rec.rows) ctx.fillRect(px(row.x) - 1.5, py(row.y) - 1.5, 3, 3);
}

/* ------------------------------------------------------------------
   THE VIEW
   ------------------------------------------------------------------ */

export class Table2D extends PlateBench {
  /**
   * @param {HTMLElement} host
   * @param {{ onAction?: (action: object) => void, tools?: string[] }} opts
   */
  constructor(host, opts = {}) {
    super(host, opts);
    this.onAction = opts.onAction || null;
    this.toolIds = opts.tools || [];
    this.state = null;
    this.shown = {};        // eased on-screen positions, id -> {x, y}
    this.drag = null;       // { id, at } while a piece is on the pointer
    this.railGap = null;    // the gap the rail is holding open during a drag
    this.gestures = new TableGestures(this);
    this.keys = new TableKeys(this.host, a => this.onAction?.(a));
    this.setPlates([{ id: 'table', label: '', note: '' }]);
  }

  apertureClass() { return 'table-aperture'; }
  gridClass() { return 'table-grid'; }

  /* The view contract `TableGestures` reads. */
  posOf(id) { return this.shown[id]; }
  dispatch(action) { this.onAction?.(action); }
  dragAt() { return this.drag?.at || null; }
  setDrag(drag, gap) {
    this.drag = drag;
    this.railGap = gap;
    if (drag) this.startAnim(); else this.drawAll();
  }
  changed() { this.drawAll(); this.startAnim(); }
  sheetRows() {
    const rec = this.state.recorder;
    if (!rec.rows.length) return [];
    const pu = plotUnits(rec);
    return rec.rows.map((row, i) => ({ i, u: { x: pu.ux(row.x), y: pu.uy(row.y) } }));
  }

  /** Take a new state; pieces ease to wherever it puts them. */
  setState(state) {
    const first = !this.state;
    this.state = state;
    for (const id of Object.keys(this.shown)) if (!state.pieces[id]) delete this.shown[id];
    for (const p of Object.values(state.pieces)) {
      if (first || !this.shown[p.id]) this.shown[p.id] = { ...p.at };
    }
    this.gestures.gesture = null;
    this.drag = null;
    this.railGap = null;
    const box = this.plates[0]?.canvas?.parentElement;
    if (box?.style) box.style.aspectRatio = `${state.bounds.w} / ${state.bounds.h}`;
    this.keys.render(state, this.toolIds);
    if (first) this.layoutAll(); else this.drawAll();
    this.startAnim();
  }

  draw(ctx, w, h) {
    return drawTable(ctx, w, h, this.state, { shown: this.shown, drag: this.drag, railGap: this.railGap, pourFrom: this.gestures.pourFrom });
  }

  /** Pieces ease toward their places, and the rail's others slide from a held-open gap. */
  tick(dt) {
    if (!this.state) return false;
    const k = 1 - Math.exp(-dt * 16);
    let moving = false;
    const targets = this.targets();
    for (const [id, to] of Object.entries(targets)) {
      const cur = this.shown[id] || (this.shown[id] = { ...to });
      const dx = to.x - cur.x;
      const dy = to.y - cur.y;
      if (Math.abs(dx) < 0.04 && Math.abs(dy) < 0.04) { cur.x = to.x; cur.y = to.y; continue; }
      cur.x += dx * k;
      cur.y += dy * k;
      moving = true;
    }
    return moving || Boolean(this.drag);
  }

  /** Put every piece where it is heading at once (no easing): for a test, or reduced motion. */
  settle() {
    if (!this.state) return;
    for (const [id, to] of Object.entries(this.targets())) this.shown[id] = { ...to };
  }

  /** Where every piece is heading: its place in the state, or the slid-apart rail. */
  targets() {
    return pieceTargets(this.state, this.drag, this.railGap);
  }

  /* ---------------- input: the DOM adapter ---------------- */

  /** PlateBench routes a press on the canvas here. */
  onPointer(plate, e) {
    const move = ev => this.pointerMove(this.unitsOf(plate, ev), ev);
    const up = ev => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      this.pointerUp(this.unitsOf(plate, ev));
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    this.pointerDown(this.unitsOf(plate, e));
  }

  unitsOf(plate, e) {
    const rect = plate.canvas.getBoundingClientRect();
    const { sc, ox, oy } = fit(plate.w, plate.h, this.state.bounds);
    // Screen pixels per canvas pixel: not 1 when the deck stands on a scaled panel.
    const k = rect.width ? rect.width / plate.w : 1;
    this.scale = sc * k;
    return { x: ((e.clientX - rect.left) / k - ox) / sc, y: ((e.clientY - rect.top) / k - oy) / sc };
  }

  /* ---------------- input: the gestures, in table units (table/gestures.js) ---------------- */

  pxToUnits(px) { return px / (this.scale || 3.4); }
  pieceAt(u) { return this.gestures.pieceAt(u); }
  fixtureHit(u) { return this.gestures.fixtureHit(u); }
  pointerDown(u) { this.gestures.pointerDown(u); }
  pointerMove(u) { this.gestures.pointerMove(u); }
  pointerUp(u) { this.gestures.pointerUp(u); }
  tapPiece(id) { this.gestures.tapPiece(id); }
  tapTarget(u) { this.gestures.tapTarget(u); }

  dispose() {
    this.keys?.dispose();
    super.dispose();
  }
}
