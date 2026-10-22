/**
 * layout.js — Where a table's furniture is, in table units, and how those
 * units sit on a real plate.
 *
 * Pure, no DOM, no THREE. Three things need the same answers and so get them
 * from here and not from each other: the drawn tabletop (`engine/table2d.js`),
 * the built one (`engine/table3d.js`) and `verify:table` / `verify:bench`.
 *
 *   fixtureLayout   a fixture's box, one track per dial and its Run key
 *   plateMap        table units to metres on the 4.8 x 1.3 m plate (uniform scale,
 *                   so a round piece stays round), and back
 */

import { SIZES, rectOf, railPositions } from './snap.js';
import { radiusOf } from './kits/registry.js';

/**
 * WORDS ON THE PLATE. A zone's label, a stage's note and a tool's caption are printed on the
 * table itself, by `drawTable`, so they have a ground of their own: a strip a label owns, which
 * nothing else may stand on (`audit.js`). The drawn table and the built one print them from here,
 * so the room a word is given is the room it takes.
 *
 *   size    the text's height, in table units (a unit is about 4 cm on the plate)
 *   adv     one character's advance as a share of `size` (the plate's monospace face)
 *   above   how far above its zone a tray's, a container's or the rail's label stands
 */
export const LABEL = Object.freeze({ size: 3, min: 2.1, adv: 0.62, above: 1.1, slotBelow: 3.9, note: 2.6, caption: 2.3 });

/** The width in table units of `text` printed at `size`. */
export const textUnits = (text, size = LABEL.size) => String(text).length * size * LABEL.adv;

/** A card's half width, in table units: wide enough for its words, never under its radius, never over four radii. */
export function cardHalf(text, r) {
  return Math.min(r * 4, Math.max(r, 0.5 * (String(text).length * 1.15 + 3.5)));
}

/** The box a line of `text` fills, `align`ed about x, with its baseline at y. */
export function lineBox(text, x, baseline, size = LABEL.size, align = 'left') {
  const w = textUnits(text, size);
  const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
  return { x0, x1: x0 + w, y0: baseline - size * 1.05, y1: baseline + size * 0.3 };
}

/** The size a word is set at to stand in `maxW` units: the label size, shrunk to fit and never below `LABEL.min`. */
export function fitSize(text, maxW, size = LABEL.size) {
  const w = textUnits(text, size);
  return w <= maxW ? size : Math.max(LABEL.min, size * maxW / w);
}

/**
 * Where a zone's words are printed: `{x, baseline, align, text, size}` for each. A tray, a container and the rail carry their
 * label over their left end (the rail its two ends); a slot's name stands under it, centred. A word longer than its zone is set
 * smaller to stand in it (never below `LABEL.min`: past that the label is too long and `audit.js` says so).
 */
export function labelLines(state, kind, zone) {
  if (kind === 'rail') {
    const r = rectOf(zone, SIZES.rail);
    const out = [];
    if (zone.first) out.push({ x: r.x0, baseline: r.y0 - LABEL.above, align: 'left', text: zone.first, size: fitSize(zone.first, r.w / 2 - 1) });
    if (zone.last) out.push({ x: r.x1, baseline: r.y0 - LABEL.above, align: 'right', text: zone.last, size: fitSize(zone.last, r.w / 2 - 1) });
    return out;
  }
  const r = rectOf(zone, kind === 'slot' ? SIZES.slot : kind === 'container' ? SIZES.container : SIZES.tray);
  if (kind === 'slot') {
    return zone.label ? [{ x: r.x0 + r.w / 2, baseline: r.y1 + LABEL.slotBelow, align: 'center', text: zone.label, size: fitSize(zone.label, Math.max(r.w, 22)) }] : [];
  }
  const out = [];
  if (zone.label) out.push({ x: r.x0 + 1.2, baseline: r.y0 - LABEL.above, align: 'left', text: zone.label, size: fitSize(zone.label, r.w - 1.2) });
  return out;
}

/** The strips of table a zone's words are printed on. */
export function labelRects(state, kind, zone) {
  return labelLines(state, kind, zone).map(l => lineBox(l.text, l.x, l.baseline, l.size, l.align));
}

/** What a stage's note occupies. */
export function noteRect(n) {
  const size = n.size || LABEL.note;
  return lineBox(n.text, n.at.x, n.at.y, size, n.align || 'left');
}

/** Where a tool's caption is printed: under the place the tool hangs, centred on it. */
export function captionLine(kit, p) {
  return { x: p.home.x, baseline: p.home.y + radiusOf(kit, p) + LABEL.caption * 1.5, align: 'center', size: LABEL.caption, text: p.caption };
}
export function captionRect(kit, p) {
  const c = captionLine(kit, p);
  return lineBox(c.text, c.x, c.baseline, c.size, 'center');
}

/** A field entry's drawn site plate, in table units, or null when the stage draws none. */
export function sitePlate(entry) {
  return entry?.at ? rectOf(entry, SIZES.site) : null;
}

/**
 * The controls of a fixture, in table units: its box, one track per dial, and
 * its Run key. Shared by the picture and the hit test so they cannot disagree.
 */
export function fixtureLayout(f) {
  const r = rectOf(f, SIZES.fixture);
  // A dial may carry state with no control of its own (`props.hidden`): a switch that only its Run key throws.
  const names = Object.keys(f.dials).filter(n => !f.props?.hidden?.includes(n));
  // A fixture may set its own margin and the pitch between its dials' tracks (a well whose atoms are drawn
  // on the track needs room for them); the defaults are every other fixture's.
  const m = f.props?.margin ?? 3;
  const pitch = f.props?.rowPitch ?? 5;
  const top = r.y0 + (f.props?.top ?? 8);
  // `grab` (per dial, in units) widens the band round a track in which a press takes the dial: a row of atoms
  // drawn on the track is its handle.
  const dials = names.map((name, i) => ({
    name, x0: r.x0 + m, x1: r.x1 - m, y: top + i * pitch, grab: f.props?.grab?.[name] ?? 0
  }));
  const bottom = top + Math.max(0, names.length - 1) * pitch;
  // A gauge, or a dial that only sets, has no Run key (`fixture.noRun`).
  const wide = f.runLabel ? Math.max(9, f.runLabel.length * 1.9 + 3) : 9;
  const run = f.noRun ? null : { x0: r.x1 - 2 - wide, x1: r.x1 - 2, y0: Math.max(bottom + 2, r.y1 - 6), y1: Math.max(bottom + 2, r.y1 - 6) + 4.5 };
  return { box: r, dials, run };
}

/**
 * THE FOE PAD. A stage that is a fight (a boss phase) has a foe watching the table, and it stands in a corner of the
 * table's own bounds so it is inside the frame the camera leans to and covers no piece: the top right, `r` units from its centre, `inset` units in from each edge. A boss phase keeps that square clear of every zone, fixture,
 * strip and loose piece; `verify:table` and `verify:bench` hold it to that. The foe's body is `foebody.js`'s, a few
 * centimetres across, so the pad is a quarter of a metre of the plate and never in the way of a hand.
 */
export const FOE_PAD = Object.freeze({ r: 11.5, inset: 12 });

/** How far above the table's far edge, in metres, a foe's body can stand in the picture: the frame leaves room for it. */
export const FOE_HEADROOM_M = 0.14;

/** The pad on a table of `bounds`: its centre and its rectangle, in table units. */
export function foePadOf(bounds) {
  const x = bounds.w - FOE_PAD.inset;
  const y = FOE_PAD.inset;
  return { x, y, r: FOE_PAD.r, rect: { x0: x - FOE_PAD.r, x1: x + FOE_PAD.r, y0: y - FOE_PAD.r, y1: y + FOE_PAD.r } };
}

/** The plate, in metres. */
export const PLATE_M = Object.freeze({ w: 4.8, d: 1.3 });

/**
 * Lay a table's bounds on the plate: the biggest uniform scale that fits with a
 * hand's margin, centred. Table x is bench x; table y runs down the screen, which
 * is toward the player, which is the bench's +z.
 *
 * @param {{w: number, h: number}} bounds
 * @param {{margin?: number}} [o] metres kept clear of the plate's edge
 */
export function plateMap(bounds, { margin = 0.06 } = {}) {
  const s = Math.min((PLATE_M.w - margin * 2) / bounds.w, (PLATE_M.d - margin * 2) / bounds.h);
  const ox = -(bounds.w * s) / 2;
  const oz = -(bounds.h * s) / 2;
  return {
    s, ox, oz,
    /** Metres per table unit. */
    metres: u => u * s,
    /** A table point to the plate (bench frame x, z). */
    toPlate: u => ({ x: ox + u.x * s, z: oz + u.y * s }),
    /** A plate point (bench frame x, z) to table units. */
    toUnits: p => ({ x: (p.x - ox) / s, y: (p.z - oz) / s }),
    /** The used zone in the bench frame, the rectangle `leanIn` frames. */
    zone: { x0: ox, x1: ox + bounds.w * s, z0: oz, z1: oz + bounds.h * s }
  };
}

/**
 * Where every visible piece is heading, in table units: its place in the state,
 * or, while one rail piece is on the pointer, the slid-apart rail with a gap held
 * open for it. The drawn and the built table ease their pieces toward this.
 *
 * @param {object} state a TableState
 * @param {{id: string}|null} drag the piece on the pointer
 * @param {number|null} railGap the gap it is over
 */
export function pieceTargets(state, drag = null, railGap = null) {
  const out = {};
  for (const p of Object.values(state.pieces)) out[p.id] = p.at;
  if (drag && railGap !== null && state.zones.rail?.order.includes(drag.id)) {
    const others = state.zones.rail.order.filter(o => o !== drag.id);
    const pos = railPositions(state.zones.rail, others.length, railGap);
    others.forEach((id, i) => { out[id] = pos[i]; });
  }
  return out;
}
