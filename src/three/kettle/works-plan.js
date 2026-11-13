/**
 * kettle/works-plan.js — The ironworks as plain data: its rooms, the doorways between them, and the two heaps outside.
 *
 * NO THREE.JS HERE, ON PURPOSE (as `ligar/mine-plan.js`). The layout generator (`tools/gen-kettle-layout.mjs`), the
 * world (`kettle.js`, `kettle/works.js`, `kettle/terrain.js`), the walk, the guide arrow and `verify:kettle` all stand
 * on this one declaration, so what is walked is what was drawn and what was checked.
 *
 * THE WORKS IS ONE BUILDING. It is a set of ROOMS (the shared layer's volumes, `lib/workings.js`): axis-aligned
 * rectangles on a 2 m grid, each with a floor (flat, or graded: a ramp) and a roof. Rooms meet along a shared plane at a
 * DOOR. The player comes in by the charge door in the south wall of the nave and walks north to the cast house; the
 * bays open off the nave. The floors are at five levels (`docs/plans/kettle-world.md` section 11.3):
 *
 *    3.2   the charge bank, up a ramp beside the nave
 *    1.2   the control cabin, on its plinth
 *    0.0   the works floor: nave, cast house, stores, scale bay, lobby, pickling, refining
 *   -2.2   the tapping pit, down a ramp from the cast house
 *   -2.4   the sump cellar, down a ramp from the lobby
 *
 * There is ONE floor everywhere: a raised floor is solid under it, a sunk one has nothing walkable over it.
 *
 * A DOOR has a height (`h`, above its threshold; none means open to the lower of the two roofs). Three kinds are not
 * ways through (`pass: false`): a `rail` (the open side of a floor over a drop: a retaining wall and a railing), and a
 * `window`. The shared layer holds the walk out of them and never routes through them.
 *
 * THE HEAPS. The slag tip and the ore stock are in the height field and closed by a ring of colliders: they are walls.
 */

import { makeWorkings } from '../lib/workings.js';

/** The walk is this square about the origin (the stage's bound for every Learn world). */
export const WALK = 100;
export const SPAWN = [0, 1.6, 76];
export const PAD = [56, 78];
/** Where the Recipe Golem is fought: the cast house floor, the furnace's front behind it. */
export const ARENA = { boss: [0, 0, -54.5], player: [0, 1.6, -40.5] };
/** A wall's thickness, standing inside its own room from the room's plane. */
export const WALL_T = 0.25;
/** The furnace: its centre and the radius of its hearth, north of the cast house's end wall. */
export const FURNACE = { x: 0, z: -72, r: 6.4 };

const rect = (minX, maxX, minZ, maxZ) => ({ minX, maxX, minZ, maxZ });
const ramp = (axis, from, to, y1) => ({ y0: 0, y1, axis, from, to });

/**
 * `top` is the roof's underside, as a height in the world. `skin` is how `works.js` dresses the room; `sky` is how much
 * of the sky's fill the cover mask leaves in it (a tall hall is dim; a cellar is dark).
 */
export const ROOMS = [
  { id: 'nave', kind: 'hall', rect: rect(-6, 6, -36, 46), floor: { y0: 0 }, top: 13, skin: 'hall', sky: 0.24 },
  { id: 'cast', kind: 'hall', rect: rect(-12, 12, -64, -36), floor: { y0: 0 }, top: 14, skin: 'cast', sky: 0.2 },
  { id: 'stores', kind: 'bay', rect: rect(6, 28, 28, 44), floor: { y0: 0 }, top: 5.2, skin: 'brick', sky: 0.07 },
  { id: 'scale', kind: 'bay', rect: rect(-30, -6, 18, 40), floor: { y0: 0 }, top: 7.5, skin: 'brick', sky: 0.09 },
  { id: 'lobby', kind: 'aisle', rect: rect(-30, -6, 6, 18), floor: { y0: 0 }, top: 6, skin: 'brick', sky: 0.09 },
  { id: 'cabin-ramp', kind: 'ramp', rect: rect(-20, -14, -8, 6), floor: ramp('z', 6, -8, 1.2), top: 6, skin: 'brick', sky: 0.07 },
  { id: 'cabin', kind: 'bay', rect: rect(-20, -6, -22, -8), floor: { y0: 1.2 }, top: 6, skin: 'panel', sky: 0.07 },
  { id: 'sump-ramp', kind: 'ramp', rect: rect(-30, -26, -8, 6), floor: ramp('z', 6, -8, -2.4), top: 5, skin: 'concrete', sky: 0.05 },
  { id: 'sump', kind: 'bay', rect: rect(-40, -20, -28, -8), floor: { y0: -2.4 }, top: 2.4, skin: 'concrete', sky: 0.03 },
  { id: 'foot', kind: 'aisle', rect: rect(6, 12, 22, 26), floor: { y0: 0 }, top: 6, skin: 'brick', sky: 0.12 },
  { id: 'charge-ramp', kind: 'ramp', rect: rect(6, 12, 2, 22), floor: ramp('z', 22, 2, 3.2), top: 13, skin: 'hall', sky: 0.24 },
  { id: 'charge', kind: 'bay', rect: rect(6, 32, -28, 2), floor: { y0: 3.2 }, top: 13, skin: 'hall', sky: 0.22 },
  { id: 'pickling', kind: 'bay', rect: rect(12, 34, 6, 26), floor: { y0: 0 }, top: 6.5, skin: 'brick', sky: 0.07 },
  { id: 'pit-ramp', kind: 'ramp', rect: rect(12, 26, -42, -38), floor: ramp('x', 12, 26, -2.2), top: 6, skin: 'concrete', sky: 0.07 },
  { id: 'pit-landing', kind: 'aisle', rect: rect(26, 30, -44, -38), floor: { y0: -2.2 }, top: 6, skin: 'concrete', sky: 0.07 },
  { id: 'pit', kind: 'bay', rect: rect(12, 30, -62, -44), floor: { y0: -2.2 }, top: 4.8, skin: 'firebrick', sky: 0.1 },
  { id: 'refining', kind: 'bay', rect: rect(-36, -12, -62, -40), floor: { y0: 0 }, top: 7, skin: 'brick', sky: 0.07 }
];

/** `a`'s `side`, the span along it, and the room on the other side (`null` is the yard). */
export const DOORS = [
  { a: 'nave', side: 'maxZ', lo: -4, hi: 4, b: null, h: 6, kind: 'gate' },
  { a: 'nave', side: 'minZ', lo: -6, hi: 6, b: 'cast' },
  { a: 'nave', side: 'maxX', lo: 32, hi: 36, b: 'stores', h: 3.6 },
  { a: 'nave', side: 'maxX', lo: 22, hi: 26, b: 'foot' },
  { a: 'nave', side: 'maxX', lo: 2, hi: 22, b: 'charge-ramp', pass: false, kind: 'rail' },
  { a: 'nave', side: 'maxX', lo: -28, hi: 2, b: 'charge', pass: false, kind: 'rail' },
  { a: 'nave', side: 'minX', lo: 24, hi: 30, b: 'scale', h: 5 },
  { a: 'nave', side: 'minX', lo: 9, hi: 15, b: 'lobby', h: 4.2 },
  { a: 'nave', side: 'minX', lo: -20, hi: -10, b: 'cabin', pass: false, kind: 'window', sill: 2.2, head: 4.0 },
  { a: 'lobby', side: 'maxZ', lo: -16, hi: -10, b: 'scale', h: 3.6 },
  { a: 'lobby', side: 'minZ', lo: -20, hi: -14, b: 'cabin-ramp', h: 4.2 },
  { a: 'lobby', side: 'minZ', lo: -30, hi: -26, b: 'sump-ramp', h: 4.2 },
  { a: 'cabin-ramp', side: 'minZ', lo: -20, hi: -14, b: 'cabin', h: 3.4 },
  { a: 'sump-ramp', side: 'minZ', lo: -30, hi: -26, b: 'sump', h: 3.6 },
  { a: 'foot', side: 'minZ', lo: 6, hi: 12, b: 'charge-ramp' },
  { a: 'charge-ramp', side: 'minZ', lo: 6, hi: 12, b: 'charge' },
  { a: 'foot', side: 'maxX', lo: 22, hi: 26, b: 'pickling', h: 3.8 },
  { a: 'cast', side: 'maxX', lo: -42, hi: -38, b: 'pit-ramp', h: 4 },
  { a: 'pit-ramp', side: 'maxX', lo: -42, hi: -38, b: 'pit-landing' },
  { a: 'pit-landing', side: 'minZ', lo: 26, hi: 30, b: 'pit' },
  { a: 'cast', side: 'maxX', lo: -62, hi: -44, b: 'pit', pass: false, kind: 'rail' },
  { a: 'cast', side: 'minX', lo: -52, hi: -46, b: 'refining', h: 4 },
  // The furnace's breast stands in the cast house's end wall: a hole in the wall that the furnace itself fills.
  { a: 'cast', side: 'minZ', lo: -4, hi: 4, b: null, pass: false, kind: 'window', sill: 0, head: 5.2 }
];

/**
 * The louvred bands high in the west walls: real holes in the wall, and the openings the cover mask lets the sun
 * through (`lib/cover.js`). `reach` is the air a band's light may land in.
 */
export const CLERESTORY = [
  { room: 'nave', side: 'minX', y0: 9, y1: 12, lo: -32, hi: -2, reach: { min: [-6, -0.5, -36], max: [32, 13, 2] } },
  { room: 'nave', side: 'minX', y0: 9.5, y1: 12, lo: 20, hi: 38, reach: { min: [-6, -0.5, 4], max: [6, 13, 46] } },
  { room: 'cast', side: 'minX', y0: 8.5, y1: 12.5, lo: -60, hi: -40, reach: { min: [-12, -2.5, -64], max: [30, 14, -36] } }
];

/** The heaps outside. `H` is the height of the top, `run` how far in from the edge the slope takes to reach it. */
export const HILLS = [
  { id: 'slag-tip', kind: 'slag', rect: rect(-98, -54, 30, 98), H: 11, run: 23 },
  { id: 'ore-stock', kind: 'ore', rect: rect(50, 96, -64, 8), H: 8, run: 17 }
];

const OPPOSITE = { minX: 'maxX', maxX: 'minX', minZ: 'maxZ', maxZ: 'minZ' };

/** The rooms as the shared layer's volumes, each with its openings (a door is declared once and opened on both sides). */
export function buildVolumes() {
  const vols = ROOMS.map(r => {
    const hi = r.floor.y1 === undefined ? r.floor.y0 : Math.max(r.floor.y0, r.floor.y1);
    return { ...r, rect: { ...r.rect }, floor: { ...r.floor }, roof: Math.round((r.top - hi) * 100) / 100, openings: [] };
  });
  const byId = new Map(vols.map(v => [v.id, v]));
  for (const d of DOORS) {
    const { a, b, side, ...rest } = d;
    byId.get(a).openings.push({ side, to: b, ...rest });
    if (b) byId.get(b).openings.push({ side: OPPOSITE[side], to: a, ...rest });
  }
  return vols;
}

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** How far (x, z) is inside a heap's rounded rectangle (positive inside), in metres. */
export function hillDepth(hill, x, z) {
  const r = hill.rect, c = 8;
  const cx = (r.minX + r.maxX) / 2, cz = (r.minZ + r.maxZ) / 2;
  const qx = Math.abs(x - cx) - ((r.maxX - r.minX) / 2 - c);
  const qz = Math.abs(z - cz) - ((r.maxZ - r.minZ) / 2 - c);
  return -(Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - c);
}

/** What a heap adds to the flat at (x, z): a slope at the angle the stuff lies at, up to a tipped-flat top. */
export function hillHeight(hill, x, z) {
  const d = hillDepth(hill, x, z);
  return d <= 0 ? 0 : hill.H * smooth(0, hill.run, d);
}

/**
 * @param {object} data the world's JSON (`works.volumes`, `works.hills`)
 */
export function makeWorksPlan(data) {
  const hills = data.works?.hills || [];
  const work = makeWorkings(data.works?.volumes || [], {
    roof: 6, holeMargin: 0, jamb: 0.5, wallInner: WALL_T + 0.1, wallDepth: 0.6, openKinds: [], outdoorDoors: true
  });

  /** The roof's underside over a room, as a height in the world. */
  const topOf = v => v.top;
  /** The top of a doorway: its own height over its threshold, or the lower of the two roofs it joins. */
  function doorTop(v, o) {
    const other = o.to ? work.byId.get(o.to) : null;
    const lowerRoof = Math.min(v.top, other ? other.top : v.top);
    if (o.pass === false || o.h === undefined) return lowerRoof;
    const mid = (o.lo + o.hi) / 2;
    const r = v.rect;
    const [x, z] = o.side === 'minX' ? [r.minX, mid] : o.side === 'maxX' ? [r.maxX - 1e-6, mid] : o.side === 'minZ' ? [mid, r.minZ] : [mid, r.maxZ - 1e-6];
    return Math.min(lowerRoof, work.floorOf(v, x, z) + o.h);
  }

  const hillsHeight = (x, z) => { let h = 0; for (const hill of hills) h += hillHeight(hill, x, z); return h; };

  /** The ring that keeps the walk off a heap: four strips just outside its foot. */
  function ringColliders() {
    const out = [];
    for (const hill of hills) {
      const r = hill.rect, o = 1.4, i = 1.0;
      out.push(
        { minX: r.minX - o, maxX: r.minX + i, minZ: r.minZ - o, maxZ: r.maxZ + o, hill: hill.id },
        { minX: r.maxX - i, maxX: r.maxX + o, minZ: r.minZ - o, maxZ: r.maxZ + o, hill: hill.id },
        { minX: r.minX - o, maxX: r.maxX + o, minZ: r.minZ - o, maxZ: r.minZ + i, hill: hill.id },
        { minX: r.minX - o, maxX: r.maxX + o, minZ: r.maxZ - i, maxZ: r.maxZ + o, hill: hill.id }
      );
    }
    return out;
  }

  /** The cover mask's boxes (the air of every room, to just inside its planes) and the openings the sun comes through. */
  function coverSpec() {
    const boxes = work.coverBoxes(-0.04).map(b => ({ ...b, sky: work.byId.get(b.id).sky ?? 0 }));
    const openings = (data.works?.clerestory || []).map(c => {
      const r = work.byId.get(c.room).rect;
      return { axis: 'x', at: c.side === 'minX' ? r.minX : r.maxX, lo: [c.y0, c.lo], hi: [c.y1, c.hi], reach: c.reach };
    });
    for (const v of work.volumes) {
      for (const o of v.openings.filter(op => op.to === null && op.pass !== false)) {
        const r = v.rect;
        const y0 = work.floorOf(v, (r.minX + r.maxX) / 2, r.maxZ - 1e-6);
        if (o.side === 'maxZ' || o.side === 'minZ') {
          openings.push({ axis: 'z', at: o.side === 'maxZ' ? r.maxZ : r.minZ, lo: [o.lo, y0], hi: [o.hi, doorTop(v, o)], reach: { min: [r.minX, y0 - 0.5, r.minZ], max: [r.maxX, v.top, r.maxZ] } });
        }
      }
    }
    return { boxes, openings };
  }

  /** The bounding rectangle of the whole works. */
  const bounds = work.volumes.reduce((b, v) => ({
    minX: Math.min(b.minX, v.rect.minX), maxX: Math.max(b.maxX, v.rect.maxX), minZ: Math.min(b.minZ, v.rect.minZ), maxZ: Math.max(b.maxZ, v.rect.maxZ)
  }), { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity });

  return { ...work, hills, hillsHeight, ringColliders, topOf, doorTop, coverSpec, bounds };
}
