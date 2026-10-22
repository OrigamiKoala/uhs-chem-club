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
import { fixtureLayout, pieceTargets, sitePlate, LABEL, labelLines, captionLine } from '../table/layout.js';
import { paintMat, paintStencil, roundRectPath, MAT } from './table-surface.js';
import { TableGestures } from '../table/gestures.js';
import { TableKeys } from './table-keys.js';

export { fixtureLayout, lampMark };

const AMBER = PLATE_COLORS.amber;

/** How far above its track a dial's words are printed, in table units: clear of the knob that rides on it. */
const DIAL_WORDS_ABOVE = 2.2;

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
  // `view.look === 'mat'` is the built table's ground: a worked mat with its words printed on it like paint. Anything else is the drawn
  // tabletop's phosphor plate. The two print the same words in the same places; only the paint differs.
  const mat = view.look === 'mat';
  if (mat) paintMat(ctx, w, h, view.seed || 1);
  else {
    ctx.fillStyle = PLATE_COLORS.bg;
    ctx.fillRect(0, 0, w, h);
  }
  if (!state) return [];
  const kit = getKit(state.kit);
  const { sc, ox, oy } = fit(w, h, state.bounds);
  const X = x => ox + x * sc;
  const Y = y => oy + y * sc;
  const holding = state.carry.held || view.drag?.id || null;
  const showPieces = view.pieces !== false;
  const ink = { label: mat ? MAT.paint : PLATE_COLORS.dust, dim: mat ? MAT.paintDim : PLATE_COLORS.dim, text: mat ? MAT.paint : PLATE_COLORS.text };
  /** A line of words at table units, `size` units tall; shrunk to `maxW` units rather than cut. */
  const words = (t, x, y, o = {}) => {
    const px = Math.max(o.minPx || 9, (o.size || LABEL.size) * sc);
    if (mat) paintStencil(ctx, t, X(x), Y(y), { size: px, align: o.align, base: o.base, color: o.color || ink.label, maxW: o.maxW ? o.maxW * sc : 0 });
    else plateText(ctx, t, X(x), Y(y), { ...o, size: px, color: o.color || ink.label, ...(o.maxW ? { maxW: o.maxW * sc } : {}) });
  };
  const text = (t, x, y, o = {}) => plateText(ctx, t, X(x), Y(y), { size: Math.max(9, 2.6 * sc), ...o });

  /* zones */
  ctx.lineWidth = 1;
  const outline = (r, lit, dashed = true) => {
    if (mat) {
      // Painted on the mat: a solid line, rounded at the corners, brighter while a piece is in the hand.
      roundRectPath(ctx, Math.round(X(r.x0)) + 0.5, Math.round(Y(r.y0)) + 0.5, Math.round(r.w * sc), Math.round(r.h * sc), Math.max(2, sc * 0.9));
      ctx.strokeStyle = lit ? MAT.paint : MAT.paintDim;
      ctx.lineWidth = Math.max(1.5, sc * 0.22);
      ctx.stroke();
      ctx.lineWidth = 1;
      return;
    }
    ctx.setLineDash?.(dashed ? [4, 3] : []);
    ctx.strokeStyle = lit ? PLATE_COLORS.steel : PLATE_COLORS.rim;
    ctx.strokeRect(Math.round(X(r.x0)) + 0.5, Math.round(Y(r.y0)) + 0.5, Math.round(r.w * sc), Math.round(r.h * sc));
    ctx.setLineDash?.([]);
  };
  /** A zone's words, where `layout.js` says they are printed. */
  const zoneWords = (kind, z, dim = true) => {
    for (const l of labelLines(state, kind, z)) words(l.text, l.x, l.baseline, { size: l.size, align: l.align, color: dim ? ink.label : ink.text });
  };
  for (const t of Object.values(state.zones.trays)) {
    const r = rectOf(t, SIZES.tray);
    // The built table stands a real tray here (walls, a lining); the flat picture keeps only its words and the count, and, while a piece
    // is in the hand, a bright ring just outside the walls: the places it can be put down.
    if (!mat) outline(r, Boolean(holding));
    else if (holding) outline({ x0: r.x0 - 1, y0: r.y0 - 1, x1: r.x1 + 1, y1: r.y1 + 1, w: r.w + 2, h: r.h + 2 }, true);
    zoneWords('tray', t);
    if (t.cap != null) {
      const n = Object.values(state.pieces).filter(p => p.zone === `tray:${t.id}` && !p.hidden).length;
      words(`${n}/${t.cap}`, r.x1 - 1.2, r.y0 - LABEL.above, { align: 'right', color: n > t.cap ? AMBER : ink.dim });
      if (n > t.cap) lampMark(ctx, X(r.x1) - 7, Y(r.y0) + 7, Math.max(10, 2.6 * sc));
    }
  }
  for (const c of Object.values(state.zones.containers)) {
    const r = rectOf(c, SIZES.container);
    if (!mat) outline(r, Boolean(holding) || view.pourFrom === c.id, false);
    // A kit may draw a container's contents itself (a heap is a pile of dots, not a level and a number):
    // `view.piles === false` leaves the dots to the built table, which stands them up.
    if (kit.paintContainer?.(ctx, c, state, { X, Y, sc, bodies: view.piles === false })) {
      zoneWords('container', c);
      continue;
    }
    const total = Object.values(c.contents).reduce((a, b) => a + b, 0);
    const cap = c.capacity || Math.max(total, 1);
    const level = Math.min(1, total / cap);
    if (!mat) {
      ctx.fillStyle = PLATE_COLORS.dim;
      ctx.fillRect(X(r.x0) + 1, Y(r.y1) - level * r.h * sc, r.w * sc - 2, level * r.h * sc - 1);
    }
    zoneWords('container', c);
    if (total > 0) words(String(Math.round(total * 100) / 100), r.x0 + r.w / 2, r.y0 + r.h / 2, { align: 'center', base: 'middle', color: ink.text });
  }
  for (const s of Object.values(state.zones.slots)) {
    const r = rectOf(s, SIZES.slot);
    outline(r, Boolean(holding));
    zoneWords('slot', s);
  }
  const rail = state.zones.rail;
  if (rail) {
    const r = rectOf(rail, SIZES.rail);
    ctx.strokeStyle = mat ? MAT.paintDim : PLATE_COLORS.rim;
    ctx.lineWidth = mat ? Math.max(1.5, sc * 0.22) : 1;
    ctx.beginPath();
    ctx.moveTo(X(r.x0), Y(rail.at.y) + 0.5);
    ctx.lineTo(X(r.x1), Y(rail.at.y) + 0.5);
    ctx.stroke();
    ctx.lineWidth = 1;
    zoneWords('rail', rail);
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
      words(f.label, r.x0 + 1.2, r.y1 - 1.6, { size: 2.6, color: waiting ? ink.label : ink.dim });
    }
  }

  /* what a stage prints on the plate: its notes, and a caption under every tool's place */
  for (const n of state.notes || []) words(n.text, n.at.x, n.at.y, { size: n.size || LABEL.note, align: n.align || 'left', color: ink.dim });
  for (const p of Object.values(state.pieces)) {
    if (!p.caption || p.hidden) continue;
    const c = captionLine(kit, p);
    words(c.text, c.x, c.baseline, { size: c.size, align: 'center', color: ink.dim, maxW: 40 });
  }

  /* fixtures */
  for (const f of Object.values(state.fixtures)) {
    const lay = fixtureLayout(f);
    // An instrument set in a board is a screen under glass: dark, so what it prints (a trace, a count, a reading) has something to stand out of.
    if (mat && view.screens) {
      ctx.fillStyle = 'rgba(14, 13, 11, 0.86)';
      roundRectPath(ctx, X(lay.box.x0), Y(lay.box.y0), lay.box.w * sc, lay.box.h * sc, Math.max(2, sc * 0.9));
      ctx.fill();
    }
    outline(lay.box, false, false);
    words(f.label, lay.box.x0 + 1.5, lay.box.y0 + 3.6, { size: 2.6, color: ink.label });
    // A kit paints what a fixture shows (a needle, a beam's path, a reading) in the box, flat:
    // the built table paints it into the plate's own picture, so the two cannot differ.
    kit.paintFixture?.(ctx, f, state, { x0: X(lay.box.x0), y0: Y(lay.box.y0), x1: X(lay.box.x1), y1: Y(lay.box.y1), sc, X, Y, lay, bodies: view.piles === false });
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
      // The words stand well clear above the track, where the knob never covers them (the built knob is a real cylinder).
      words(`${dial.label || d.name} ${shown}`, d.x0, Math.max(d.y - DIAL_WORDS_ABOVE, lay.box.y0 + 6.3), { size: 2.4, color: ink.text, maxW: d.x1 - d.x0 });
      // A tick under every step of a stepped dial, so the knob has places to be and the player sees how many.
      if (mat && dial.step && dial.max > dial.min) {
        const n = Math.round((dial.max - dial.min) / dial.step);
        if (n > 0 && n <= 12) {
          ctx.strokeStyle = MAT.paintDim;
          ctx.lineWidth = Math.max(1, sc * 0.16);
          for (let i = 0; i <= n; i++) {
            const tx = X(d.x0 + (i / n) * (d.x1 - d.x0));
            ctx.beginPath();
            ctx.moveTo(tx, Y(d.y) + sc * 1.3);
            ctx.lineTo(tx, Y(d.y) + sc * 2.3);
            ctx.stroke();
          }
          ctx.lineWidth = 1;
        }
      }
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
      // As wide as its words: a token that says "Between A and B" is a card that holds it.
      ctx.font = `500 ${Math.max(9, Math.min(12, r * 0.7))}px "JetBrains Mono", "Quantico", monospace`;
      const half = Math.max(r, (Math.max(label.length * 3.1, ctx.measureText ? ctx.measureText(label).width : 0) + 8) / 2);
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
    // Kept inside the strip: a line carried on past the readings never runs over the scale.
    ctx.save?.();
    ctx.beginPath();
    ctx.rect(X(r.x0), Y(r.y0), r.w * sc, r.h * sc);
    ctx.clip?.();
    ctx.strokeStyle = AMBER;
    ctx.beginPath();
    ctx.moveTo(px(pu.xlo), py(readY(line, pu.xlo)));
    ctx.lineTo(px(pu.xhi), py(readY(line, pu.xhi)));
    ctx.stroke();
    ctx.restore?.();
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
  setState(state, opts = {}) {
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
    // The keys are the table's own tools (a quest's stages may list different ones; a boss's do).
    this.keys.render(state, state.tools || this.toolIds, { undo: opts.undo });
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
  tapPiece(id, at) { this.gestures.tapPiece(id, at); }
  tapTarget(u) { this.gestures.tapTarget(u); }

  dispose() {
    this.keys?.dispose();
    super.dispose();
  }
}
