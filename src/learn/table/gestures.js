/**
 * gestures.js — What a hand does on a table, as reducer actions.
 *
 * The drawn tabletop (`engine/table2d.js`) and the built one (`engine/table3d.js`)
 * are two pictures of one table. They differ in how a pointer becomes a point in
 * TABLE UNITS (a canvas, or a ray onto the plate) and in how the result is drawn;
 * everything between those two ends is here, once: what a press lands on, when a
 * move becomes a drag, what a release means, the two-tap twin of every drag, and
 * the context keys a held piece or a pending field item offers. A stage therefore
 * grades the same through either view, and `verify:table` drives this class for
 * both.
 *
 * Dispatches ONLY reducer actions (`table/model.js`); it never touches a table.
 *
 * THE VIEW passes itself in. What it must provide:
 *   state                the current TableState
 *   posOf(id)            where a piece is drawn right now (table units)
 *   pxToUnits(px)        screen pixels to table units at the table's scale
 *   dispatch(action)     send one action to the runner
 *   changed()            something the picture shows has changed (a drag, a gap, a pour source)
 *   sheetRows()          optional: every recorded row's position on the sheet, table units
 *   showsSite(id)        optional: false when the view draws no site plate for field point `id`
 *                        (the built table, where the world has the point and the player walks to it)
 */

import { getKit, radiusOf } from './kits/registry.js';
import {
  SIZES, GRAB_REACH, rectOf, zoneAt, railIndexAt, resolveDrop, targetString
} from './snap.js';
import { snapDial } from './model.js';
import { fixtureLayout, sitePlate } from './layout.js';

/** Pixels a press must move before it is a drag and not a tap. */
export const SLOP_PX = 5;
/** Smallest grab radius, in pixels, however small the piece is drawn. */
export const GRAB_MIN_PX = 16;
const inRect = (r, p) => p.x >= r.x0 && p.x <= r.x1 && p.y >= r.y0 && p.y <= r.y1;

/** Can this piece be turned over / scaled? A kit says so per kind (`kinds.x.flip`, `.scale`). */
export function canFlip(kit, piece) { return Boolean(piece && kit.kinds?.[piece.kind]?.flip); }
export function canScale(kit, piece) { return Boolean(piece && kit.kinds?.[piece.kind]?.scale && (kit.maxScale || 1) > 1); }

/**
 * The action a pour from container `from` to container `to` makes: one step of
 * whatever `from` holds most of. A kit sets the step (`kit.pourStep(state, from,
 * to, what)`, default 1). Null when there is nothing to pour.
 */
export function pourAction(state, kit, fromId, toId) {
  const from = state.zones.containers[fromId];
  const to = state.zones.containers[toId];
  if (!from || !to || from === to) return null;
  let what = null;
  for (const [k, v] of Object.entries(from.contents)) if (v > 0 && (what === null || v > from.contents[what])) what = k;
  if (what === null) return null;
  const amount = kit.pourStep ? kit.pourStep(state, from, to, what) : 1;
  return { pour: { from: fromId, to: toId, what, amount } };
}

/**
 * The keys that belong to what is in the hand or still out in the field, as
 * `{id, label, action, enabled}`. Self-describing labels, so none needs a legend.
 */
export function contextKeys(state, kit) {
  const keys = [];
  const held = state.carry.held ? state.pieces[state.carry.held] : null;
  if (held && canFlip(kit, held)) {
    keys.push({ id: 'flip', label: 'Flip', action: { flip: held.id }, enabled: true });
  }
  if (held && canScale(kit, held)) {
    const cur = held.props.scale || 1;
    keys.push({ id: 'smaller', label: 'Smaller', action: { scale: { piece: held.id, factor: cur - 1 } }, enabled: cur > 1 });
    keys.push({ id: 'larger', label: 'Larger', action: { scale: { piece: held.id, factor: cur + 1 } }, enabled: cur < (kit.maxScale || 1) });
  }
  // A held piece that is joined to others can be pulled out of its group (`kinds.x.split`).
  if (held && kit.kinds?.[held.kind]?.split && held.joinedTo.length) {
    keys.push({ id: 'split', label: 'Pull Out', action: { split: held.id }, enabled: true });
  }
  for (const f of Object.values(state.fetch)) {
    if (f.at) continue;   // a drawn site plate is the way to take it
    if (pendingFetch(state, f.id)) keys.push({ id: `fetch:${f.id}`, label: f.label, action: { fetch: f.id }, enabled: true });
  }
  return keys;
}

/** Is there still something to bring back from field point `id`? */
export function pendingFetch(state, id) {
  return Object.values(state.pieces).some(p => p.fetchFrom === id && p.hidden);
}

export class TableGestures {
  constructor(view) {
    this.view = view;
    this.gesture = null;
    this.pourFrom = null;
  }

  get state() { return this.view.state; }
  get kit() { return getKit(this.state.kit); }

  /** Let go of whatever the hand was doing (a cancelled press). */
  cancel() {
    this.gesture = null;
    this.view.setDrag?.(null, null);
  }

  reset() {
    this.gesture = null;
    this.pourFrom = null;
  }

  /* ---------------- what is under a point ---------------- */

  pieceAt(u) {
    const s = this.state;
    const kit = this.kit;
    let best = null;
    let top = null;
    for (const p of Object.values(s.pieces)) {
      if (p.hidden) continue;
      const c = this.view.posOf(p.id) || p.at;
      // A piece in the hand is taken again only on the piece itself: a target beside it (the next rung of a ladder, a slot a
      // hair's breadth away) must be tappable, and the generous reach that makes a piece easy to grab would swallow it.
      const isOrbitPiece = Boolean(p.zone && s.zones.trays[p.zone.replace(/^tray:/, '')]?.orbit);
      const generous = (s.carry.held === p.id || (s.carry.held && isOrbitPiece)) ? 1 : GRAB_REACH;
      const reach = (s.carry.held && isOrbitPiece)
        ? radiusOf(kit, p)
        : Math.max(radiusOf(kit, p) * generous, this.view.pxToUnits(GRAB_MIN_PX));
      const d = Math.hypot(c.x - u.x, c.y - u.y);
      if (d <= reach && (!best || d < best.d)) best = { id: p.id, d };
      // A tool that lies ON another piece (a lens over its dish: `kinds.x.onTop`) is the top thing there: a press on its own
      // body takes it, never the piece underneath, so it can always be picked up again.
      if (kit.kinds?.[p.kind]?.onTop && p.joinedTo.length && d <= radiusOf(kit, p) && (!top || d < top.d)) top = { id: p.id, d };
    }
    if (top) return top.id;
    return best ? best.id : null;
  }

  /**
   * The bond under a point: a join between two pieces the kit lets be pulled apart (`kinds.x.split`), pressed in the gap
   * between their bodies. A tap there breaks it (`split`), so a join made by mistake is undone where it was made.
   * Never while a piece is in the hand: that tap belongs to where the piece goes.
   */
  linkAt(u) {
    const s = this.state;
    const kit = this.kit;
    if (s.carry.held) return null;
    for (const key of Object.keys(s.links)) {
      if (s.links[key]?.tool) continue;
      const [a, b] = key.split('|');
      const pa = s.pieces[a];
      const pb = s.pieces[b];
      if (!pa || !pb || pa.hidden || pb.hidden) continue;
      if (!kit.kinds?.[pa.kind]?.split || !kit.kinds?.[pb.kind]?.split) continue;
      const A = this.view.posOf(a) || pa.at;
      const B = this.view.posOf(b) || pb.at;
      const dx = B.x - A.x;
      const dy = B.y - A.y;
      const len = Math.hypot(dx, dy);
      if (len < 1e-6) continue;
      const t = ((u.x - A.x) * dx + (u.y - A.y) * dy) / (len * len);
      const along = t * len;
      // Only the gap between the two bodies: a press on an atom is a press on the atom.
      if (along <= radiusOf(kit, pa) * 0.85 || along >= len - radiusOf(kit, pb) * 0.85) continue;
      const across = Math.hypot(u.x - (A.x + t * dx), u.y - (A.y + t * dy));
      if (across <= Math.max(1.4, this.view.pxToUnits(12))) return { a, b };
    }
    return null;
  }

  fixtureHit(u) {
    for (const f of Object.values(this.state.fixtures)) {
      const lay = fixtureLayout(f);
      const pad = this.view.pxToUnits(10);
      for (const d of lay.dials) {
        if (u.x >= d.x0 - pad && u.x <= d.x1 + pad && Math.abs(u.y - d.y) <= Math.max(pad, d.grab || 0)) return { kind: 'dial', fixture: f.id, dial: d.name, track: d };
      }
      const r = lay.run;
      if (r && u.x >= r.x0 - pad / 2 && u.x <= r.x1 + pad / 2 && u.y >= r.y0 - pad / 2 && u.y <= r.y1 + pad / 2) return { kind: 'run', fixture: f.id };
    }
    return null;
  }

  containerAt(u) {
    for (const c of Object.values(this.state.zones.containers)) {
      // A container that is `still` (a heap, a dock, a pan) holds things but is never poured from or into.
      if (c.props?.still) continue;
      if (inRect(rectOf(c, SIZES.container), u)) return c.id;
    }
    return null;
  }

  /** The drawn site plate under a point, when something there is still to be taken. */
  siteAt(u) {
    for (const f of Object.values(this.state.fetch)) {
      const r = sitePlate(f);
      // A view that has no plate to show for a point (the world has it: the player walks there) says so.
      if (this.view.showsSite && !this.view.showsSite(f.id)) continue;
      if (r && inRect(r, u) && pendingFetch(this.state, f.id)) return f.id;
    }
    return null;
  }

  onSheet(u) {
    const rec = this.state.recorder;
    return rec.rows.length > 0 && inRect(rectOf(rec.box, { w: 30, h: 18 }), u);
  }

  /** Would a press at `u` take hold of something? (The built view asks, so an empty spot stays a look.) */
  wouldGrab(u) {
    if (this.fixtureHit(u)) return true;
    if (this.linkAt(u)) return true;
    const id = this.pieceAt(u);
    if (id && !this.state.pieces[id].fixed) return true;
    if (this.onSheet(u)) return true;
    if (this.siteAt(u)) return true;
    return this.containerAt(u) !== null && !this.state.carry.held;
  }

  /* ---------------- the gestures ---------------- */

  pointerDown(u) {
    if (!this.state) return;
    const fh = this.fixtureHit(u);
    if (fh?.kind === 'dial') { this.gesture = { kind: 'dial', ...fh }; this.dialTo(fh, u); return; }
    if (fh?.kind === 'run') { this.gesture = { kind: 'run', fixture: fh.fixture }; return; }
    const bond = this.linkAt(u);
    if (bond) { this.gesture = { kind: 'bond', ...bond }; return; }
    const id = this.pieceAt(u);
    if (id && !this.state.pieces[id].fixed) {
      const c = this.view.posOf(id) || this.state.pieces[id].at;
      this.gesture = { kind: 'piece', id, start: u, off: { x: c.x - u.x, y: c.y - u.y }, moved: false };
      return;
    }
    if (this.onSheet(u)) { this.gesture = { kind: 'sheet', start: u }; return; }
    const site = this.siteAt(u);
    if (site) { this.gesture = { kind: 'site', id: site }; return; }
    const jar = this.containerAt(u);
    if (jar && !this.state.carry.held) { this.gesture = { kind: 'jar', id: jar, start: u, moved: false }; return; }
    this.gesture = { kind: 'table' };
  }

  pointerMove(u) {
    const g = this.gesture;
    if (!g || !this.state) return;
    if (g.kind === 'dial') { this.dialTo(g, u); return; }
    if (g.kind === 'jar') {
      if (Math.hypot(u.x - g.start.x, u.y - g.start.y) >= this.view.pxToUnits(SLOP_PX)) g.moved = true;
      return;
    }
    if (g.kind !== 'piece') return;
    if (!g.moved) {
      if (Math.hypot(u.x - g.start.x, u.y - g.start.y) < this.view.pxToUnits(SLOP_PX)) return;
      g.moved = true;
    }
    const at = { x: u.x + g.off.x, y: u.y + g.off.y };
    const rail = this.state.zones.rail;
    const gap = rail && rail.order.includes(g.id) && zoneAt(this.state, at)?.kind === 'rail'
      ? railIndexAt(this.state, at.x, g.id)
      : null;
    this.view.setDrag?.({ id: g.id, at }, gap);
    this.view.changed?.();
  }

  pointerUp(u) {
    const g = this.gesture;
    this.gesture = null;
    if (!g || !this.state) return;
    if (g.kind === 'run') {
      const hit = this.fixtureHit(u);
      if (hit?.kind === 'run' && hit.fixture === g.fixture) this.view.dispatch({ run: g.fixture });
      return;
    }
    if (g.kind === 'bond') {
      const now = this.linkAt(u);
      if (now && now.a === g.a && now.b === g.b) this.view.dispatch({ split: [g.a, g.b] });
      return;
    }
    if (g.kind === 'piece' && g.moved) {
      const at = this.view.dragAt?.() || { x: u.x + g.off.x, y: u.y + g.off.y };
      this.view.setDrag?.(null, null);
      this.view.dispatch({ place: { piece: g.id, at } });
      return;
    }
    if (g.kind === 'piece') { this.tapPiece(g.id, u); return; }
    if (g.kind === 'site') { if (this.siteAt(u) === g.id) this.view.dispatch({ fetch: g.id }); return; }
    if (g.kind === 'jar') { this.jarUp(g, u); return; }
    if (g.kind === 'sheet') { this.sheetUp(g, u); return; }
    if (g.kind === 'table') {
      if (this.pourFrom) { this.pourFrom = null; this.view.changed?.(); }
      this.tapTarget(u);
    }
  }

  /**
   * Tap on a piece: pick it up, put it down, or (holding another) the piece is
   * the target. A card is turned over, or scaled, by the keys a held card offers
   * (`contextKeys`): a second quick tap already means "put it down".
   */
  tapPiece(id, at = null) {
    const held = this.state.carry.held;
    this.pourFrom = null;
    // A piece that is only MARKED, never carried (`props.markable`: a particle the player tags), is flipped by a tap: one touch, no carrying.
    if (!held && this.state.pieces[id]?.props?.markable) { this.view.dispatch({ flip: id }); return; }
    if (!held) { this.view.dispatch({ pick: id }); return; }
    if (held === id) { this.view.dispatch({ pick: null }); return; }
    // A piece on the rail is a place along it: the held piece goes before it when the tap lands on its left
    // half and after it on its right, so the end of a full rail can be tapped. Anything else is a target
    // at the piece itself (a join, or the zone it stands in).
    const target = this.state.pieces[id];
    const isOrbit = Boolean(target.zone && this.state.zones.trays[target.zone.replace(/^tray:/, '')]?.orbit);
    this.tapTarget(at && (target.zone === 'rail' || isOrbit) ? at : target.at);
  }

  /** Tap where the held piece should go: resolved exactly as a drop there would be. */
  tapTarget(u) {
    const held = this.state.carry.held;
    if (!held) return;
    const target = resolveDrop(this.state, this.kit, held, u);
    this.view.dispatch({ place: { to: targetString(target) } });
  }

  /** A jar: drag to another jar pours into it; tap one, then another, does the same. */
  jarUp(g, u) {
    const over = this.containerAt(u);
    const from = g.id;
    if (g.moved) {
      this.pourFrom = null;
      const act = over && over !== from ? pourAction(this.state, this.kit, from, over) : null;
      if (act) this.view.dispatch(act); else this.view.changed?.();
      return;
    }
    if (this.pourFrom && this.pourFrom !== from) {
      const act = pourAction(this.state, this.kit, this.pourFrom, from);
      this.pourFrom = null;
      if (act) this.view.dispatch(act); else this.view.changed?.();
      return;
    }
    this.pourFrom = this.pourFrom === from ? null : from;
    this.view.changed?.();
  }

  /** The paper strip: drag from one reading to another lays the straightedge across them; tap lifts it. */
  sheetUp(g, u) {
    const rows = this.view.sheetRows?.() || [];
    const reach = this.view.pxToUnits(26);
    const nearest = p => {
      let best = null;
      for (const r of rows) {
        const d = Math.hypot(r.u.x - p.x, r.u.y - p.y);
        if (d <= reach && (!best || d < best.d)) best = { i: r.i, d };
      }
      return best ? best.i : null;
    };
    const a = nearest(g.start);
    const b = nearest(u);
    if (a !== null && b !== null && a !== b) {
      this.view.dispatch({ lay: { kind: 'straightedge', through: [Math.min(a, b), Math.max(a, b)] } });
    } else if (this.state.recorder.tool && a === null) {
      this.view.dispatch({ lay: null });
    }
  }

  dialTo(h, u) {
    const f = this.state.fixtures[h.fixture];
    const d = f.dials[h.dial];
    const t = h.track || fixtureLayout(f).dials.find(x => x.name === h.dial);
    const frac = Math.max(0, Math.min(1, (u.x - t.x0) / (t.x1 - t.x0)));
    const value = snapDial(d, d.min + frac * (d.max - d.min));
    if (value !== d.value) this.view.dispatch({ setDial: { fixture: h.fixture, dial: h.dial, value } });
  }
}
