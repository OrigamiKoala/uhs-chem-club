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

import { PlateBench, PLATE_COLORS, plateText, raster, aperture, escText } from './plates.js';
import { getKit, radiusOf } from '../table/kits/index.js';
import {
  SIZES, GRAB_REACH, rectOf, zoneAt, railPositions, railIndexAt, resolveDrop, targetString
} from '../table/snap.js';
import { snapDial } from '../table/model.js';
import { toolDef } from '../table/tools.js';
import { lineOf, readY } from '../table/recorder.js';

/** Pixels a press must move before it is a drag and not a tap. */
const SLOP_PX = 5;
/** Smallest grab radius, in pixels, however small the piece is drawn. */
const GRAB_MIN_PX = 16;

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
 * The controls of a fixture, in table units: its box, one track per dial, and
 * its Run key. Shared by the picture and the hit test so they cannot disagree.
 */
export function fixtureLayout(f) {
  const r = rectOf(f, SIZES.fixture);
  const names = Object.keys(f.dials);
  const dials = names.map((name, i) => ({
    name, x0: r.x0 + 3, x1: r.x1 - 3, y: r.y0 + 8 + i * 5
  }));
  const bottom = r.y0 + 8 + Math.max(0, names.length - 1) * 5;
  const run = { x0: r.x1 - 11, x1: r.x1 - 2, y0: Math.max(bottom + 2, r.y1 - 6), y1: Math.max(bottom + 2, r.y1 - 6) + 4.5 };
  return { box: r, dials, run };
}

/**
 * Paint a table. `view` carries what is not the table's own state: the pieces'
 * eased positions (`shown`), the piece on the pointer (`drag`), the gap the
 * rail is holding open (`railGap`) and the kit's pieces.
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
  }
  for (const c of Object.values(state.zones.containers)) {
    const r = rectOf(c, SIZES.container);
    outline(r, Boolean(holding), false);
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

  /* fixtures */
  for (const f of Object.values(state.fixtures)) {
    const lay = fixtureLayout(f);
    outline(lay.box, false, false);
    text(f.label, lay.box.x0 + 1.5, lay.box.y0 + 3.6, { color: PLATE_COLORS.dust });
    for (const d of lay.dials) {
      const dial = f.dials[d.name];
      const frac = dial.max === dial.min ? 0 : (dial.value - dial.min) / (dial.max - dial.min);
      ctx.strokeStyle = PLATE_COLORS.steel;
      ctx.beginPath();
      ctx.moveTo(X(d.x0), Y(d.y));
      ctx.lineTo(X(d.x1), Y(d.y));
      ctx.stroke();
      ctx.fillStyle = PLATE_COLORS.dust;
      const kx = X(d.x0 + frac * (d.x1 - d.x0));
      ctx.fillRect(kx - 3, Y(d.y) - 5, 6, 10);
      text(`${dial.label || d.name} ${dial.value}`, d.x0, d.y - 1.2, { color: PLATE_COLORS.dust, size: Math.max(9, 2.3 * sc) });
    }
    ctx.strokeStyle = PLATE_COLORS.steel;
    ctx.strokeRect(Math.round(X(lay.run.x0)) + 0.5, Math.round(Y(lay.run.y0)) + 0.5, Math.round((lay.run.x1 - lay.run.x0) * sc), Math.round((lay.run.y1 - lay.run.y0) * sc));
    text('Run', (lay.run.x0 + lay.run.x1) / 2, (lay.run.y0 + lay.run.y1) / 2, { align: 'center', base: 'middle', color: PLATE_COLORS.text });
  }

  /* the recorder's strip */
  drawRecorder(ctx, state, X, Y, sc);

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
    const square = p.kind === 'card' || p.token;
    const label = String(p.label ?? p.id);
    ctx.fillStyle = p.token ? PLATE_COLORS.bg : PLATE_COLORS.steel;
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
  const r = rectOf(rec.box, { w: 30, h: 18 });
  ctx.strokeStyle = PLATE_COLORS.rim;
  ctx.strokeRect(Math.round(X(r.x0)) + 0.5, Math.round(Y(r.y0)) + 0.5, Math.round(r.w * sc), Math.round(r.h * sc));
  const xs = rec.rows.map(p => p.x);
  const ys = rec.rows.map(p => p.y);
  const lo = (a) => Math.min(...a);
  const span = (a) => (Math.max(...a) - Math.min(...a)) || 1;
  const px = x => X(r.x0 + 2 + ((x - lo(xs)) / span(xs)) * (r.w - 4));
  const py = y => Y(r.y1 - 2 - ((y - lo(ys)) / span(ys)) * (r.h - 4));
  const line = lineOf(rec);
  if (line) {
    ctx.strokeStyle = AMBER;
    ctx.beginPath();
    ctx.moveTo(px(lo(xs)), py(readY(line, lo(xs))));
    ctx.lineTo(px(Math.max(...xs)), py(readY(line, Math.max(...xs))));
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
    this.gesture = null;
    this.setPlates([{ id: 'table', label: '', note: '' }]);
  }

  apertureClass() { return 'table-aperture'; }
  gridClass() { return 'table-grid'; }

  /** Take a new state; pieces ease to wherever it puts them. */
  setState(state) {
    const first = !this.state;
    this.state = state;
    for (const id of Object.keys(this.shown)) if (!state.pieces[id]) delete this.shown[id];
    for (const p of Object.values(state.pieces)) {
      if (first || !this.shown[p.id]) this.shown[p.id] = { ...p.at };
    }
    this.gesture = null;
    this.drag = null;
    this.railGap = null;
    const box = this.plates[0]?.canvas?.parentElement;
    if (box?.style) box.style.aspectRatio = `${state.bounds.w} / ${state.bounds.h}`;
    this.renderTools();
    if (first) this.layoutAll(); else this.drawAll();
    this.startAnim();
  }

  draw(ctx, w, h) {
    return drawTable(ctx, w, h, this.state, { shown: this.shown, drag: this.drag, railGap: this.railGap });
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
    const out = {};
    const s = this.state;
    for (const p of Object.values(s.pieces)) out[p.id] = p.at;
    if (this.drag && this.railGap !== null && s.zones.rail?.order.includes(this.drag.id)) {
      const others = s.zones.rail.order.filter(o => o !== this.drag.id);
      const pos = railPositions(s.zones.rail, others.length, this.railGap);
      others.forEach((id, i) => { out[id] = pos[i]; });
    }
    return out;
  }

  /* ---------------- tools ---------------- */

  renderTools() {
    if (!this.host || !this.state) return;
    let bar = this.toolBar;
    if (!bar || bar.parentElement !== this.host) {
      bar = document.createElement('div');
      bar.className = 'table-tools lq-tool-row';
      this.host.appendChild(bar);
      this.toolBar = bar;
      bar.addEventListener('click', e => {
        const btn = e.target.closest?.('[data-table-tool]');
        if (!btn || btn.disabled) return;
        const def = toolDef(getKit(this.state.kit), btn.dataset.tableTool);
        const action = def?.press(this.state);
        if (action) this.onAction?.(action);
      });
    }
    const kit = getKit(this.state.kit);
    bar.innerHTML = this.toolIds.map(id => {
      const def = toolDef(kit, id);
      if (!def) return '';
      const on = Boolean(def.active?.(this.state));
      const enabled = def.enabled ? def.enabled(this.state) : true;
      return `<button type="button" class="btn-secondary quest-btn-sm lq-tool${on ? ' selected' : ''}" data-table-tool="${escText(id)}" aria-pressed="${on}"${enabled ? '' : ' disabled'}>${escText(def.label)}</button>`;
    }).join('');
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

  /* ---------------- input: the gestures, in table units ---------------- */

  pxToUnits(px) { return px / (this.scale || 3.4); }

  pieceAt(u) {
    const s = this.state;
    const kit = getKit(s.kit);
    let best = null;
    for (const p of Object.values(s.pieces)) {
      if (p.hidden) continue;
      const c = this.shown[p.id] || p.at;
      const reach = Math.max(radiusOf(kit, p) * GRAB_REACH, this.pxToUnits(GRAB_MIN_PX));
      const d = Math.hypot(c.x - u.x, c.y - u.y);
      if (d <= reach && (!best || d <= best.d)) best = { id: p.id, d };
    }
    return best ? best.id : null;
  }

  fixtureHit(u) {
    for (const f of Object.values(this.state.fixtures)) {
      const lay = fixtureLayout(f);
      const pad = this.pxToUnits(10);
      for (const d of lay.dials) {
        if (u.x >= d.x0 - pad && u.x <= d.x1 + pad && Math.abs(u.y - d.y) <= pad) return { kind: 'dial', fixture: f.id, dial: d.name, track: d };
      }
      const r = lay.run;
      if (u.x >= r.x0 - pad / 2 && u.x <= r.x1 + pad / 2 && u.y >= r.y0 - pad / 2 && u.y <= r.y1 + pad / 2) return { kind: 'run', fixture: f.id };
    }
    return null;
  }

  pointerDown(u) {
    if (!this.state) return;
    const fh = this.fixtureHit(u);
    if (fh?.kind === 'dial') { this.gesture = { kind: 'dial', ...fh }; this.dialTo(fh, u); return; }
    if (fh?.kind === 'run') { this.gesture = { kind: 'run', fixture: fh.fixture }; return; }
    const id = this.pieceAt(u);
    if (id && !this.state.pieces[id].fixed) {
      const c = this.shown[id] || this.state.pieces[id].at;
      this.gesture = { kind: 'piece', id, start: u, off: { x: c.x - u.x, y: c.y - u.y }, moved: false };
      return;
    }
    this.gesture = { kind: 'table' };
  }

  pointerMove(u) {
    const g = this.gesture;
    if (!g || !this.state) return;
    if (g.kind === 'dial') { this.dialTo(g, u); return; }
    if (g.kind !== 'piece') return;
    if (!g.moved) {
      if (Math.hypot(u.x - g.start.x, u.y - g.start.y) < this.pxToUnits(SLOP_PX)) return;
      g.moved = true;
    }
    const at = { x: u.x + g.off.x, y: u.y + g.off.y };
    this.drag = { id: g.id, at };
    const rail = this.state.zones.rail;
    this.railGap = rail && rail.order.includes(g.id) && zoneAt(this.state, at)?.kind === 'rail'
      ? railIndexAt(this.state, at.x, g.id)
      : null;
    this.startAnim();
  }

  pointerUp(u) {
    const g = this.gesture;
    this.gesture = null;
    if (!g || !this.state) return;
    if (g.kind === 'run') {
      const hit = this.fixtureHit(u);
      if (hit?.kind === 'run' && hit.fixture === g.fixture) this.onAction?.({ run: g.fixture });
      return;
    }
    if (g.kind === 'piece' && g.moved) {
      const at = this.drag?.at || { x: u.x + g.off.x, y: u.y + g.off.y };
      this.drag = null;
      this.railGap = null;
      this.onAction?.({ place: { piece: g.id, at } });
      this.drawAll();
      return;
    }
    if (g.kind === 'piece') { this.tapPiece(g.id); return; }
    if (g.kind === 'table') this.tapTarget(u);
  }

  /** Tap on a piece: pick it up, put it down, or (holding another) the piece is the target. */
  tapPiece(id) {
    const held = this.state.carry.held;
    if (!held) { this.onAction?.({ pick: id }); return; }
    if (held === id) { this.onAction?.({ pick: null }); return; }
    this.tapTarget(this.state.pieces[id].at);
  }

  /** Tap where the held piece should go: resolved exactly as a drop there would be. */
  tapTarget(u) {
    const held = this.state.carry.held;
    if (!held) return;
    const target = resolveDrop(this.state, getKit(this.state.kit), held, u);
    this.onAction?.({ place: { to: targetString(target) } });
  }

  dialTo(h, u) {
    const f = this.state.fixtures[h.fixture];
    const d = f.dials[h.dial];
    const t = h.track || fixtureLayout(f).dials.find(x => x.name === h.dial);
    const frac = Math.max(0, Math.min(1, (u.x - t.x0) / (t.x1 - t.x0)));
    const value = snapDial(d, d.min + frac * (d.max - d.min));
    if (value !== d.value) this.onAction?.({ setDial: { fixture: h.fixture, dial: h.dial, value } });
  }

  dispose() {
    this.toolBar = null;
    super.dispose();
  }
}
