/**
 * mine-plan.js — The hills and the workings driven into them, as plain data and plain functions.
 *
 * NO THREE.JS HERE, ON PURPOSE. The generator (`tools/gen-ligar-layout.mjs`), the world
 * (`ligar.js`, `ligar/mine.js`), the walk, the guide arrow and the verifiers all stand on the
 * SAME declaration, so what is walked is what was drawn and what was checked.
 *
 * THE HILLS. A trap-bench hill is a rounded rectangle that rises from the plateau in two steps,
 * like a flow that was poured twice: a cliff up to a bench (`H1`, half the height), a flat
 * stretch of that bench, a second cliff up to the top. It is added to the height field
 * (`hillsHeight`), so the ground mesh, the walk and everything standing on either are one thing.
 * A hill is NOT CLIMBABLE: `ringColliders` closes it round, so the player can never stand on its
 * bench or its top, and the walk never has two floors to choose between (the plan's layered walk
 * is not needed). The only ways in are the portals.
 *
 * THE WORKINGS. A mine is a set of axis-aligned VOLUMES. A volume is a rectangle with a floor
 * (flat, or graded along one axis) and, unless it is a CUTTING, a roof `ROOF` above the floor.
 *   cutting   an open trench dug back into a hill's face to a portal; the terrain is cut away
 *             over it (like the quarry's pit) and its walls are the hill in section
 *   drift     a level tunnel, 4.2 m across
 *   chamber   a room a bench stands in: 11.2 x 11 m, the bench against the back wall
 * Volumes meet along a shared plane; an OPENING on each of the two sides is the doorway, and
 * `to` names the volume on the other side (the open foot of a cutting has `to: null`).
 *
 * Everything the world needs of a volume (its floor, its wall segments, the colliders along those,
 * the clearance boxes the light mask uses, the terrain holes, the route a guide follows) is derived
 * by the shared workings layer, `lib/workings.js`, which was lifted from this file. What stays here is
 * Ligar's own: the hills, the ring that closes them, and the basalt's constants.
 */

import { fbm2 } from '../erebus/noise.js';
import { makeWorkings, SIDE } from '../lib/workings.js';

export { SIDE };

/** Floor to roof, in every tunnel and chamber. The plan's chambers are at least 4.2 m. */
export const ROOF = 4.4;
/** How far the terrain's hole reaches past a cutting's walls, so their faces stand in open air. */
export const HOLE_MARGIN = 0.8;
/** The hill's collider ring: out to this many metres past the hill's edge, in to `IN`. */
export const RING = { out: 4.0, in: 1.5 };
/** How far a wall's collider runs past the end of its segment, so a doorway's jamb is solid. */
export const JAMB = 0.5;
/** How far the wall columns stand proud of a tunnel's nominal wall plane (`ligar/basalt.js`). */
export const PROUD = { base: 0.05, spread: 0.2 };
export const PROUD_MAX = 0.3;

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/* ============================================================== the hills */

/** Signed distance (m) from (x, z) to a hill's rounded rectangle: positive outside, negative inside. */
export function hillDistance(hill, x, z) {
  const r = hill.rect;
  const cx = (r.minX + r.maxX) / 2, cz = (r.minZ + r.maxZ) / 2;
  const c = hill.corner ?? 6;
  const qx = Math.abs(x - cx) - ((r.maxX - r.minX) / 2 - c);
  const qz = Math.abs(z - cz) - ((r.maxZ - r.minZ) / 2 - c);
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - c;
}

/** How far the outer slope reaches past the rectangle. */
export const HILL_REACH = 4.5;

/** The height a hill adds to the plateau at (x, z). */
export function hillHeight(hill, x, z) {
  const r = hill.rect;
  if (x < r.minX - HILL_REACH - 1 || x > r.maxX + HILL_REACH + 1 || z < r.minZ - HILL_REACH - 1 || z > r.maxZ + HILL_REACH + 1) return 0;
  const d = hillDistance(hill, x, z);
  if (d >= HILL_REACH) return 0;
  const H = hill.H;
  const H1 = H * (hill.bench ?? 0.5);
  // The first flow: a cliff up from the plateau to a bench (the headwalls of the portals stand on it).
  const s1 = 1 - smooth(-0.5, HILL_REACH, d);
  // The second: a cliff up from the bench to the top.
  const s2 = 1 - smooth(-8.0, -4.0, d);
  // Ragged tops, never raised under a portal's cutting (its walls follow whatever is there).
  const rag = fbm2(x / 8 + 3.1, z / 8 - 1.7, 2) * 0.7 * s1;
  return H1 * s1 + (H - H1) * s2 + rag;
}

/** The sum of every hill's rise at (x, z). */
export function hillsHeight(hills, x, z) {
  let h = 0;
  for (const hill of hills) h += hillHeight(hill, x, z);
  return h;
}

/* ============================================================== the workings */

/**
 * @param {object} data the world's JSON (`hills`, `mine.volumes`)
 */
export function makeMinePlan(data) {
  const hills = data.hills || [];
  const work = makeWorkings(data.mine?.volumes || [], { roof: ROOF, holeMargin: HOLE_MARGIN, jamb: JAMB, wallInner: PROUD_MAX, wallDepth: 0.6 });
  const { cuttings, terrainHoles } = work;

  /**
   * The ring that keeps a player off a hill: four strips round it from `RING.out` metres outside its
   * edge to `RING.in` metres inside, split where a cutting enters. Everything inside the ring is rock
   * or workings, and the workings carry their own walls.
   */
  function ringColliders() {
    const out = [];
    for (const hill of hills) {
      const r = hill.rect;
      const o = RING.out, i = RING.in;
      const box = (minX, maxX, minZ, maxZ) => out.push({ minX, maxX, minZ, maxZ, hill: hill.id });
      // The cuttings that enter this hill, with the hole they cut (the strip must not close them).
      const gaps = { minX: [], maxX: [], minZ: [], maxZ: [] };
      for (const c of cuttings.filter(c => c.hill === hill.id)) {
        const hole = terrainHoles()[cuttings.indexOf(c)];
        for (const o2 of c.openings.filter(op => op.to === null)) {
          if (o2.side === 'minX' || o2.side === 'maxX') gaps[o2.side].push([hole.minZ, hole.maxZ]);
          else gaps[o2.side].push([hole.minX, hole.maxX]);
        }
      }
      const strip = (side, a0, a1, fixedLo, fixedHi) => {
        let cur = a0;
        for (const [g0, g1] of [...gaps[side]].sort((p, q) => p[0] - q[0])) {
          if (g0 > cur) {
            if (side === 'minX' || side === 'maxX') box(fixedLo, fixedHi, cur, g0); else box(cur, g0, fixedLo, fixedHi);
          }
          cur = Math.max(cur, g1);
        }
        if (a1 > cur) {
          if (side === 'minX' || side === 'maxX') box(fixedLo, fixedHi, cur, a1); else box(cur, a1, fixedLo, fixedHi);
        }
      };
      strip('minX', r.minZ - o, r.maxZ + o, r.minX - o, r.minX + i);
      strip('maxX', r.minZ - o, r.maxZ + o, r.maxX - i, r.maxX + o);
      strip('minZ', r.minX - o, r.maxX + o, r.minZ - o, r.minZ + i);
      strip('maxZ', r.minX - o, r.maxX + o, r.maxZ - i, r.maxZ + o);
    }
    return out;
  }

  return { hills, ...work, ringColliders };
}
