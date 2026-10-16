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
 * Everything the world needs of a volume is derived here: its floor, its wall segments (the
 * sides minus the doorways), the colliders along those, the clearance boxes the light mask uses,
 * the terrain holes, and the route a guide follows.
 */

import { fbm2 } from '../erebus/noise.js';

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

const SIDES = ['minX', 'maxX', 'minZ', 'maxZ'];
/** For each side: the axis it runs along, and the unit vector pointing INTO the volume. */
export const SIDE = {
  minX: { along: 'z', dir: [1, 0] },
  maxX: { along: 'z', dir: [-1, 0] },
  minZ: { along: 'x', dir: [0, 1] },
  maxZ: { along: 'x', dir: [0, -1] }
};

/** Half-open: a point on the plane two volumes share belongs to the one that begins there, never to neither. */
function insideRect(r, x, z) {
  return x >= r.minX && x < r.maxX && z >= r.minZ && z < r.maxZ;
}

/** A volume's floor height at (x, z): flat, or graded linearly along its `axis`. */
function floorOf(v, x, z) {
  const f = v.floor;
  if (f.y1 === undefined || f.y1 === f.y0) return f.y0;
  const s = f.axis === 'x' ? x : z;
  const t = (s - f.from) / (f.to - f.from);
  return f.y0 + (f.y1 - f.y0) * Math.min(1, Math.max(0, t));
}

/** The lowest and highest floor a volume has. */
function floorRange(v) {
  const f = v.floor;
  return f.y1 === undefined ? [f.y0, f.y0] : [Math.min(f.y0, f.y1), Math.max(f.y0, f.y1)];
}

/**
 * @param {object} data the world's JSON (`hills`, `mine.volumes`)
 */
export function makeMinePlan(data) {
  const hills = data.hills || [];
  const volumes = (data.mine?.volumes || []).map(v => ({ ...v, openings: v.openings || [] }));
  const byId = new Map(volumes.map(v => [v.id, v]));
  const tunnels = volumes.filter(v => v.kind !== 'cutting');
  const cuttings = volumes.filter(v => v.kind === 'cutting');

  /** The volume (x, z) stands in, or null. A drift's end sits on the plane its chamber's wall stands on. */
  function volumeAt(x, z) {
    for (const v of volumes) if (insideRect(v.rect, x, z)) return v;
    return null;
  }

  /** The walking floor under (x, z) inside the workings, or null when it is in none of them. */
  function floorAt(x, z) {
    const v = volumeAt(x, z);
    return v ? floorOf(v, x, z) : null;
  }

  /** A volume's wall along one side, as the segments left once its doorways are taken out. */
  function wallSegments(v) {
    const out = [];
    for (const side of SIDES) {
      const { along, dir } = SIDE[side];
      const r = v.rect;
      const lo = along === 'z' ? r.minZ : r.minX;
      const hi = along === 'z' ? r.maxZ : r.maxX;
      const plane = side === 'minX' ? r.minX : side === 'maxX' ? r.maxX : side === 'minZ' ? r.minZ : r.maxZ;
      // The openings on this side, sorted, clipped to the side.
      const gaps = v.openings.filter(o => o.side === side)
        .map(o => [Math.max(lo, o.lo), Math.min(hi, o.hi)])
        .filter(([a, b]) => b > a)
        .sort((a, b) => a[0] - b[0]);
      let cursor = lo;
      const spans = [];
      for (const [a, b] of gaps) {
        if (a > cursor + 0.01) spans.push([cursor, a]);
        cursor = Math.max(cursor, b);
      }
      if (hi > cursor + 0.01) spans.push([cursor, hi]);
      for (const [a, b] of spans) {
        const seg = along === 'z'
          ? { ax: plane, az: a, bx: plane, bz: b }
          : { ax: a, az: plane, bx: b, bz: plane };
        out.push({ volume: v.id, side, ...seg, dirX: dir[0], dirZ: dir[1], from: a, to: b, plane });
      }
    }
    return out;
  }

  /** Every wall of every volume. */
  const walls = volumes.flatMap(wallSegments);

  /** Thin boxes along every wall: the walk is held out of the column faces and the rock behind. */
  function wallColliders() {
    return walls.map(w => {
      const [lo, hi] = [w.from - JAMB, w.to + JAMB];
      // From the deepest the face stands into the room, back into the rock.
      const inner = PROUD_MAX;
      const depth = 0.6;
      if (w.side === 'minX') return { minX: w.plane - depth, maxX: w.plane + inner, minZ: lo, maxZ: hi };
      if (w.side === 'maxX') return { minX: w.plane - inner, maxX: w.plane + depth, minZ: lo, maxZ: hi };
      if (w.side === 'minZ') return { minX: lo, maxX: hi, minZ: w.plane - depth, maxZ: w.plane + inner };
      return { minX: lo, maxX: hi, minZ: w.plane - inner, maxZ: w.plane + depth };
    });
  }

  /** The rectangles the terrain mesh is cut away over: each cutting, widened into the rock at its sides. */
  function terrainHoles() {
    return cuttings.map(v => {
      const r = v.rect;
      const open = side => v.openings.some(o => o.side === side && o.to === null);
      return {
        minX: r.minX - (open('minX') ? 0 : HOLE_MARGIN),
        maxX: r.maxX + (open('maxX') ? 0 : HOLE_MARGIN),
        minZ: r.minZ - (open('minZ') ? 0 : HOLE_MARGIN),
        maxZ: r.maxZ + (open('maxZ') ? 0 : HOLE_MARGIN)
      };
    });
  }

  /** The air of every roofed volume as a box, a hand's breadth larger: what the light mask covers. */
  function coverBoxes(pad = 0.15) {
    return tunnels.map(v => {
      const [lo, hi] = floorRange(v);
      return {
        id: v.id,
        min: [v.rect.minX - pad, lo - 0.3, v.rect.minZ - pad],
        max: [v.rect.maxX + pad, hi + ROOF + 0.3, v.rect.maxZ + pad]
      };
    });
  }

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

  /** The point a doorway opens onto, on its plane: the middle of its span. */
  function doorPoint(v, o) {
    const r = v.rect;
    const mid = (o.lo + o.hi) / 2;
    if (o.side === 'minX') return [r.minX, mid];
    if (o.side === 'maxX') return [r.maxX, mid];
    if (o.side === 'minZ') return [mid, r.minZ];
    return [mid, r.maxZ];
  }

  /**
   * The way on foot from (fx, fz) to (tx, tz): a list of [x, z] points. Inside one volume, or when
   * the target is on the open ground, the straight line; otherwise out through the cutting's foot
   * (when starting outside), then door by door.
   */
  function routeTo(fx, fz, tx, tz) {
    const target = volumeAt(tx, tz);
    const start = volumeAt(fx, fz);
    if (!target || target === start) return [[fx, fz], [tx, tz]];

    // Breadth-first over the volumes. `null` is the open ground: it meets every cutting's open foot.
    const prev = new Map();
    const queue = [];
    const door = new Map();   // "from>to" -> the doorway point
    const link = (a, b, p) => { door.set(`${a?.id ?? 'out'}>${b?.id ?? 'out'}`, p); };
    for (const v of volumes) {
      for (const o of v.openings) {
        const other = o.to ? byId.get(o.to) : null;
        link(v, other, doorPoint(v, o));
        if (other) link(other, v, doorPoint(v, o)); else link(null, v, doorPoint(v, o));
      }
    }
    const startKey = start ? start.id : 'out';
    prev.set(startKey, null);
    queue.push(startKey);
    while (queue.length) {
      const k = queue.shift();
      if (k === target.id) break;
      const here = k === 'out' ? null : byId.get(k);
      const next = [];
      if (here) {
        for (const o of here.openings) next.push(o.to ?? 'out');
      } else {
        for (const c of cuttings) if (c.openings.some(o => o.to === null)) next.push(c.id);
      }
      for (const n of next) {
        if (prev.has(n)) continue;
        prev.set(n, k);
        queue.push(n);
      }
    }
    if (!prev.has(target.id)) return [[fx, fz], [tx, tz]];
    const chain = [];
    for (let k = target.id; k !== null; k = prev.get(k)) chain.unshift(k);
    const pts = [[fx, fz]];
    for (let i = 0; i < chain.length - 1; i++) {
      const a = chain[i] === 'out' ? null : byId.get(chain[i]);
      const b = byId.get(chain[i + 1]);
      const p = door.get(`${a?.id ?? 'out'}>${b.id}`);
      if (!p) continue;
      // Coming in from the open ground: line up with the cutting's axis a few metres out, so the way in is
      // straight along it rather than across its corner. (Only when the player is further out than that.)
      if (!a) {
        const foot = b.openings.find(o => o.to === null);
        const out = SIDE[foot.side].dir;
        const lead = [p[0] - out[0] * 8, p[1] - out[1] * 8];
        if (Math.hypot(fx - p[0], fz - p[1]) > 10 && (fx - p[0]) * -out[0] + (fz - p[1]) * -out[1] > 4) pts.push(lead);
      }
      pts.push(p);
    }
    pts.push([tx, tz]);
    return pts;
  }

  return {
    hills, volumes, byId, tunnels, cuttings, walls,
    volumeAt, floorAt, floorOf, wallSegments, wallColliders, terrainHoles, coverBoxes, ringColliders, routeTo, doorPoint
  };
}
