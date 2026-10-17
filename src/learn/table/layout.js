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
  const names = Object.keys(f.dials);
  const dials = names.map((name, i) => ({
    name, x0: r.x0 + 3, x1: r.x1 - 3, y: r.y0 + 8 + i * 5
  }));
  const bottom = r.y0 + 8 + Math.max(0, names.length - 1) * 5;
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
