/**
 * workings.js — Rooms that meet at doorways, as plain data and plain functions.
 *
 * NO THREE.JS HERE, ON PURPOSE. A layout generator, a world, its walk, the guide arrow and the
 * verifiers all stand on the SAME declaration, so what is walked is what was drawn and what was
 * checked. This is the world-neutral half of Ligar's `mine-plan.js`, lifted unchanged; Ligar keeps
 * its hills and its basalt constants there and builds its plan from this one.
 *
 * THE WORKINGS. A set of axis-aligned VOLUMES. A volume is a rectangle with a floor (flat, or
 * graded along one axis) and, unless its kind is an OPEN one (Ligar's `cutting`), a roof above
 * the floor. Volumes meet along a shared plane; an OPENING on each of the two sides is the
 * doorway, and `to` names the volume on the other side (an opening onto open ground has
 * `to: null`).
 *
 * Everything a world needs of a volume is derived here: its floor, its wall segments (the sides
 * minus the doorways), the colliders along those, the clearance boxes the light mask uses
 * (`lib/cover.js`), the terrain holes, and the route a guide follows door by door.
 *
 * OPTIONS (every one opt-in; the defaults are Ligar's, so Ligar is unchanged):
 *   roof          floor to roof where a volume names none of its own (`volume.roof`)
 *   holeMargin    how far a terrain hole reaches past an open volume's closed sides
 *   jamb          how far a wall's collider runs past the end of its segment
 *   wallInner     how far a wall's collider reaches into the room from its plane
 *   wallDepth     and how far back behind it
 *   openKinds     the kinds with no roof (their terrain is cut away; they are not covered)
 *   outdoorDoors  true when ANY volume may open onto open ground (`to: null`), not only an open
 *                 kind: a building with a door in its wall
 * An opening with `pass: false` is a gap in the WALL that is not a way through (a railing over a
 * drop, a window): no wall is drawn across it, the walk is still held out of it, and the guide
 * never routes through it.
 */

const SIDES = ['minX', 'maxX', 'minZ', 'maxZ'];
/** For each side: the axis it runs along, and the unit vector pointing INTO the volume. */
export const SIDE = {
  minX: { along: 'z', dir: [1, 0] },
  maxX: { along: 'z', dir: [-1, 0] },
  minZ: { along: 'x', dir: [0, 1] },
  maxZ: { along: 'x', dir: [0, -1] }
};

/** Half-open: a point on the plane two volumes share belongs to the one that begins there, never to neither. */
export function insideRect(r, x, z) {
  return x >= r.minX && x < r.maxX && z >= r.minZ && z < r.maxZ;
}

/** A volume's floor height at (x, z): flat, or graded linearly along its `axis`. */
export function floorOf(v, x, z) {
  const f = v.floor;
  if (f.y1 === undefined || f.y1 === f.y0) return f.y0;
  const s = f.axis === 'x' ? x : z;
  const t = (s - f.from) / (f.to - f.from);
  return f.y0 + (f.y1 - f.y0) * Math.min(1, Math.max(0, t));
}

/** The lowest and highest floor a volume has. */
export function floorRange(v) {
  const f = v.floor;
  return f.y1 === undefined ? [f.y0, f.y0] : [Math.min(f.y0, f.y1), Math.max(f.y0, f.y1)];
}

/**
 * @param {object[]} volumeList `[{ id, kind, rect, floor, openings, roof? }]`
 * @param {object} [opts] see the header; the defaults are Ligar's
 */
export function makeWorkings(volumeList, opts = {}) {
  const {
    roof: ROOF = 4.4, holeMargin: HOLE_MARGIN = 0.8, jamb: JAMB = 0.5,
    wallInner = 0.3, wallDepth = 0.6, openKinds = ['cutting'], outdoorDoors = false
  } = opts;
  const isOpen = v => openKinds.includes(v.kind);
  const volumes = (volumeList || []).map(v => ({ ...v, openings: v.openings || [] }));
  const byId = new Map(volumes.map(v => [v.id, v]));
  const tunnels = volumes.filter(v => !isOpen(v));
  const cuttings = volumes.filter(isOpen);
  /** Floor to roof of one volume. */
  const roofOf = v => v.roof ?? ROOF;

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

  /** The gaps that are not ways through (`pass: false`), as segments shaped like a wall's: railings and windows. */
  const barriers = volumes.flatMap(v => v.openings.filter(o => o.pass === false).map(o => {
    const { along, dir } = SIDE[o.side];
    const r = v.rect;
    const plane = o.side === 'minX' ? r.minX : o.side === 'maxX' ? r.maxX : o.side === 'minZ' ? r.minZ : r.maxZ;
    const seg = along === 'z' ? { ax: plane, az: o.lo, bx: plane, bz: o.hi } : { ax: o.lo, az: plane, bx: o.hi, bz: plane };
    return { volume: v.id, side: o.side, ...seg, dirX: dir[0], dirZ: dir[1], from: o.lo, to: o.hi, plane, opening: o };
  }));

  /** Thin boxes along every wall: the walk is held out of the column faces and the rock behind. */
  function wallColliders() {
    return [...walls, ...barriers].map(w => {
      const [lo, hi] = [w.from - JAMB, w.to + JAMB];
      // From the deepest the face stands into the room, back into the rock.
      const inner = wallInner;
      const depth = wallDepth;
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
        max: [v.rect.maxX + pad, hi + roofOf(v) + 0.3, v.rect.maxZ + pad]
      };
    });
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
        if (o.pass === false) continue;
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
        for (const o of here.openings) if (o.pass !== false) next.push(o.to ?? 'out');
      } else {
        for (const c of (outdoorDoors ? volumes : cuttings)) if (c.openings.some(o => o.to === null && o.pass !== false)) next.push(c.id);
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
        const foot = b.openings.find(o => o.to === null && o.pass !== false);
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
    volumes, byId, tunnels, cuttings, walls, barriers, roofOf,
    volumeAt, floorAt, floorOf, floorRange, wallSegments, wallColliders, terrainHoles, coverBoxes, routeTo, doorPoint
  };
}
