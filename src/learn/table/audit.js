/**
 * audit.js — Does a table's layout hold together, in table units.
 *
 * Pure, no DOM, no THREE. `verify:table` runs `auditTable` on the opening table of
 * every stage of every converted quest that is not on the layout ratchet
 * (`tools/layout-legacy.json`), and a new quest gets no line. The rule it keeps is
 * the one a player feels first: a bench that looks like a pile of things dropped on
 * a board. Every thing on the table has its own ground, and every word printed on
 * the table has its own ground too.
 *
 * WHAT OCCUPIES SPACE
 *   a piece        a disc of its kit radius (a card or a token its whole width, a rect kind its rect);
 *                  a piece standing in a zone is held to that zone instead
 *   a zone         its rectangle, AND the strip of table its label is printed on
 *   a fixture      its box (a `backdrop` fixture is a surface other things stand on)
 *   a note         the line a stage prints on the plate, and the caption under a tool's home
 *   the strip      the recorder's paper strip
 *
 * NOTHING MAY OVERLAP ANYTHING EXCEPT WHAT IT STANDS IN: a loose piece clear of every zone,
 * label, note and fixture, and of every other piece (with a hand's gap between); two zones
 * apart; a label clear of the next thing's body; a printed line short enough for the room it
 * has. The gaps are what make the layout read as laid out and not scattered.
 *
 * THE FIT RULE for words printed on a piece: a label that cannot fit its face at a readable
 * size is a bad label. `fitsFace` is what the painters use to shrink a word and what the
 * audit uses to refuse one that would have to shrink past `MIN_FACE_PX`.
 */

import { radiusOf } from './kits/registry.js';
import { SIZES, rectOf, CELL } from './snap.js';
import { cardHalf, labelRects, noteRect, captionRect } from './layout.js';

/** A hand's gap, in table units, kept between a loose piece and anything else it could be taken for. */
export const GAP = 0;

const hit = (a, b, gap = 0) => a.x0 < b.x1 + gap && b.x0 < a.x1 + gap && a.y0 < b.y1 + gap && b.y0 < a.y1 + gap;
const discRect = (c, r) => ({ x0: c.x - r, x1: c.x + r, y0: c.y - r, y1: c.y + r });

/** The rectangle a piece covers at `at`. */
export function pieceRect(kit, p, at = p.at) {
  const k = kit.kinds?.[p.kind];
  if (k?.rect) return { x0: at.x - k.rect.hw, x1: at.x + k.rect.hw, y0: at.y - k.rect.hh, y1: at.y + k.rect.hh };
  const r = radiusOf(kit, p);
  if (p.kind === 'card' || p.token) {
    const half = cardHalf(p.label || '', r);
    return { x0: at.x - half, x1: at.x + half, y0: at.y - r, y1: at.y + r };
  }
  return discRect(at, r);
}

/**
 * What a table occupies, as one rectangle in table units: every zone and the words printed on it, every fixture, note and caption,
 * the site plates, and every piece where it starts, with `pad` units of room to work in round it, never less than `minW` x `minH`
 * (a bench of three atoms in a row still has a table to build on), and never past the table's edge. The built table frames THIS, not
 * the whole mat, so what is on the table fills the glass and a mat that is mostly empty is not.
 */
export function usedRect(state, kit, { pad = 10, minW = 70, minH = 34, extra = [] } = {}) {
  const { w, h } = state.bounds;
  let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
  const add = r => { x0 = Math.min(x0, r.x0); y0 = Math.min(y0, r.y0); x1 = Math.max(x1, r.x1); y1 = Math.max(y1, r.y1); };
  for (const t of Object.values(state.zones.trays)) { add(rectOf(t, SIZES.tray)); labelRects(state, 'tray', t).forEach(add); }
  for (const t of Object.values(state.zones.slots)) { add(rectOf(t, SIZES.slot)); labelRects(state, 'slot', t).forEach(add); }
  for (const t of Object.values(state.zones.containers)) { add(rectOf(t, SIZES.container)); labelRects(state, 'container', t).forEach(add); }
  if (state.zones.rail) { add(rectOf(state.zones.rail, SIZES.rail)); labelRects(state, 'rail', state.zones.rail).forEach(add); }
  for (const f of Object.values(state.fixtures)) add(rectOf(f, SIZES.fixture));
  for (const f of Object.values(state.fetch)) if (f.at) add(rectOf(f, SIZES.site));
  for (const n of state.notes || []) add(noteRect(n));
  for (const p of Object.values(state.pieces)) {
    if (p.hidden) continue;
    add(pieceRect(kit, p));
    if (p.caption) add(captionRect(kit, p));
  }
  for (const r of extra) add(r);
  if (!Number.isFinite(x0)) return { x0: 0, y0: 0, x1: w, y1: h };
  x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
  const grow = (lo, hi, min, max) => {
    if (hi - lo < min) { const c = (lo + hi) / 2; lo = c - min / 2; hi = c + min / 2; }
    if (lo < 0) { hi = Math.min(max, hi - lo); lo = 0; }
    if (hi > max) { lo = Math.max(0, lo - (hi - max)); hi = max; }
    return [Math.max(0, lo), Math.min(max, hi)];
  };
  [x0, x1] = grow(x0, x1, Math.min(minW, w), w);
  [y0, y1] = grow(y0, y1, Math.min(minH, h), h);
  return { x0, y0, x1, y1 };
}

/**
 * Every problem with a table's layout, as strings. `opts.legacy` waives the checks a quest on
 * the ratchet is not yet held to (every label strip and note, and the gap between pieces).
 */
export function auditTable(state, kit, opts = {}) {
  const out = [];
  const { w, h } = state.bounds;
  const items = [];   // { name, r, kind: 'zone'|'label'|'fixture'|'note'|'strip'|'site', backdrop? }
  const add = (name, r, kind, extra = {}) => items.push({ name, r, kind, ...extra });

  for (const t of Object.values(state.zones.trays)) {
    add(`tray ${t.id}`, rectOf(t, SIZES.tray), 'zone', { id: `tray:${t.id}` });
    for (const l of labelRects(state, 'tray', t)) add(`the label of tray ${t.id}`, l, 'label', { owner: `tray:${t.id}` });
  }
  for (const t of Object.values(state.zones.slots)) {
    add(`slot ${t.id}`, rectOf(t, SIZES.slot), 'zone', { id: `slot:${t.id}` });
    for (const l of labelRects(state, 'slot', t)) add(`the label of slot ${t.id}`, l, 'label', { owner: `slot:${t.id}` });
  }
  for (const t of Object.values(state.zones.containers)) {
    add(`container ${t.id}`, rectOf(t, SIZES.container), 'zone', { id: `container:${t.id}` });
    for (const l of labelRects(state, 'container', t)) add(`the label of container ${t.id}`, l, 'label', { owner: `container:${t.id}` });
  }
  if (state.zones.rail) {
    add('the rail', rectOf(state.zones.rail, SIZES.rail), 'zone', { id: 'rail' });
    for (const l of labelRects(state, 'rail', state.zones.rail)) add('the rail\'s end label', l, 'label', { owner: 'rail' });
  }
  for (const f of Object.values(state.fixtures)) {
    add(`fixture ${f.id}`, rectOf(f, SIZES.fixture), 'fixture', { backdrop: Boolean(f.props?.backdrop) });
  }
  for (const f of Object.values(state.fetch)) {
    if (f.at) add(`site plate ${f.id}`, rectOf(f, SIZES.site), 'site');
  }
  add('the recorder strip', rectOf(state.recorder.box, { w: 30, h: 18 }), 'strip');
  (state.notes || []).forEach((n, i) => add(`the note "${n.text.slice(0, 24)}"`, noteRect(n), 'note'));
  for (const p of Object.values(state.pieces)) {
    if (p.caption && !p.hidden) add(`the caption of ${p.id}`, captionRect(kit, p), 'note');
  }

  for (const i of items) {
    if (i.r.x0 < 0 || i.r.y0 < 0 || i.r.x1 > w || i.r.y1 > h) {
      // A label strip runs off the table only when it would be cut: say so once, plainly.
      out.push(`${i.name} is not wholly on the table`);
    }
  }

  // Pieces: where they start, and what they stand in.
  const pieces = Object.values(state.pieces).filter(p => !p.hidden);
  for (const p of pieces) {
    const r = pieceRect(kit, p);
    if (r.x0 < 0 || r.y0 < 0 || r.x1 > w || r.y1 > h) out.push(`piece ${p.id} starts off the table`);
    if (p.zone && p.zone !== 'rail') {
      const z = items.find(i => i.id === p.zone);
      if (z && (r.x0 < z.r.x0 - 0.01 || r.x1 > z.r.x1 + 0.01 || r.y0 < z.r.y0 - 0.01 || r.y1 > z.r.y1 + 0.01)) {
        out.push(`piece ${p.id} does not fit inside ${z.name}: it is ${((r.x1 - r.x0)).toFixed(1)} units across in a place ${(z.r.x1 - z.r.x0).toFixed(1)} wide`);
      }
    }
  }
  for (const p of pieces) {
    if (p.zone) continue;
    const r = pieceRect(kit, p);
    for (const i of items) {
      if (i.kind === 'strip' && !opts.strip) continue;
      if (p.fixed && i.kind === 'fixture') continue;
      if (i.backdrop) continue;
      if (opts.legacy && (i.kind === 'label' || i.kind === 'note')) continue;
      if (hit(r, i.r)) out.push(`loose piece ${p.id} starts on ${i.name}`);
    }
  }
  if (!opts.legacy) {
    const loose = pieces.filter(p => !p.zone);
    for (let a = 0; a < loose.length; a++) {
      for (let b = a + 1; b < loose.length; b++) {
        const A = loose[a];
        const B = loose[b];
        // Pieces joined or laid on one another (a lens on its dish) are one thing.
        if (A.joinedTo.includes(B.id)) continue;
        // Two discs touch by distance, not by their bounding squares.
        const round = !(kit.kinds?.[A.kind]?.rect || kit.kinds?.[B.kind]?.rect || A.kind === 'card' || B.kind === 'card' || A.token || B.token);
        const touching = round
          ? Math.hypot(A.at.x - B.at.x, A.at.y - B.at.y) < radiusOf(kit, A) + radiusOf(kit, B) + GAP
          : hit(pieceRect(kit, A), pieceRect(kit, B), GAP);
        if (touching) out.push(`pieces ${A.id} and ${B.id} start touching: a hand cannot tell them apart`);
      }
    }
  }

  // Zones, fixtures, labels and notes against one another.
  for (let a = 0; a < items.length; a++) {
    for (let b = a + 1; b < items.length; b++) {
      const A = items[a];
      const B = items[b];
      if (A.kind === 'strip' && !opts.strip) continue;
      if (B.kind === 'strip' && !opts.strip) continue;
      if ((A.backdrop && B.kind !== 'fixture') || (B.backdrop && A.kind !== 'fixture')) continue;
      if (opts.legacy && (A.kind === 'label' || A.kind === 'note' || B.kind === 'label' || B.kind === 'note')) continue;
      // A zone's own label belongs to it: it stands against it by design.
      if ((A.owner && A.owner === B.id) || (B.owner && B.owner === A.id)) continue;
      if (hit(A.r, B.r)) out.push(`${A.name} overlaps ${B.name}`);
    }
  }
  return out;
}

/** The pitch a zone's pieces are laid at, and whether a piece of this radius fits the cell. */
export function cellFits(zone, fallback, radius) {
  const cell = zone.cell || CELL;
  const r = rectOf(zone, fallback);
  return { cell, fits: radius * 2 <= cell + 0.01, cols: Math.max(1, Math.floor(r.w / cell)), rows: Math.max(1, Math.floor(r.h / cell)) };
}
