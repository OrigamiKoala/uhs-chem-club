/**
 * hall-plan.js — The plant's buildings that Tallow's benches stand in, as data. No THREE.
 *
 * Tallow's ground is a dead-flat pan (its row in `docs/plans/world-distinction-plan.md` section 6), so the
 * levels and the rooms come from the plant: each bench stands inside one of the refinery's own buildings, and
 * the walk between them is out on the pan. This module is the one declaration the world (`tallow.js`), the
 * buildings (`halls.js`), the layout generator (`tools/gen-tallow-layout.mjs`) and the checks
 * (`tools/verify-tallow.mjs`) all read.
 *
 * THE HOST FRAME (as `stations.js`): origin on the floor under the middle of the plate, +z toward the player,
 * +x to the player's right. A hall is declared in its site's host frame:
 *
 *   room    the INSIDE faces of the walls: x0 (left), x1 (right), z0 (back), z1 (front)
 *   wall    the wall's thickness (outside the room)
 *   roof    'gable-x' (ridge along local x), 'gable-z' (ridge along local z), 'mono-z' (rising toward z0),
 *           'mono-x' (rising toward x1) or 'flat'; `low` and `high` its heights at the inside faces
 *   walls   which of left/right/back/front the hall builds (a wall another hall owns is `false`)
 *   doors   { wall, a, b, top }: a gap from the floor to `top`, from `a` to `b` along the wall (x for
 *           back/front, z for left/right). The only ways in
 *   slots   { wall, a, b, y0?, y1 }: an opening the walk may not use (the belt's way through a wall, the
 *           line's way into the next room); a collider still closes it at the floor
 *   windows { wall, a, b, y0, y1 }: an opening glazed with dark glass
 *   lamps   [x, y, z]: caged sodium luminaires, pooled; each hangs on a rod from the steel over it
 *   kind    'clad' (portal frame, profiled sheet), 'block' (blockwork, slab roof), 'plinth' (block to 1.2 m,
 *           sheet above)
 *   sky     the fraction of the sky's fill the cover mask leaves inside
 *   shed    halls built as one building share one floor height
 *
 * A site faces cardinally, so a host frame turns to the world by quarter turns and every hall is an
 * axis-aligned box in the world.
 */

/** Where each bench stands and the way it faces (toward its approach). The generator writes these unchanged. */
export const SITE_FRAMES = Object.freeze({
  'site-1': { pos: [17.0, 4.0], f: [1, 0] },
  'site-3': { pos: [36.0, -18.0], f: [0, 1] },
  'site-4': { pos: [31.0, -52.0], f: [0, 1] },
  'site-5': { pos: [-8.69, 9.0], f: [0, 1] },
  'site-6': { pos: [-20.09, 9.0], f: [0, 1] }
});

/** The pit (site-2), kept as `initSublevel` builds it: its room and stair, for the cover and the route. */
export const PIT = Object.freeze({
  room: { minX: -22.0, maxX: 14.0, minZ: -46.0, maxZ: -31.0 },
  stair: { minX: -6.6, maxX: -1.4, minZ: -31.0, maxZ: -22.0 },
  floorY: -5.6, ceilingY: -0.85, sky: 0.15
});

export const HALLS = Object.freeze([
  {
    // THE EVAPORATOR HALL at the belt's tail. The crystalliser drops its salt onto the belt; the sample point
    // cuts a sample from the stream. A tall portal-frame shed, gable ends front and back.
    id: 'evaporator-hall', site: 'site-1', kind: 'clad',
    room: { x0: -7.6, x1: 7.6, z0: -6.6, z1: 8.4 }, wall: 0.2,
    roof: { type: 'gable-z', low: 9.5, high: 10.4 },
    walls: { left: true, right: true, back: true, front: true },
    doors: [{ wall: 'front', a: -2.2, b: 2.2, top: 4.4 }],
    // The belt leaves through the west gable (world z 3.1 to 5.7).
    slots: [{ wall: 'back', a: -1.7, b: 0.9, y1: 9.5 }],
    windows: [],
    lamps: [[-3.6, 5.8, 1.6], [3.6, 5.8, 1.6], [-1.5, 5.8, -4.6]],
    sky: 0.18
  },
  {
    // THE CONTROL HOUSE. Blockwork under a concrete slab; the relay room's glazed front and the record wall
    // stand behind the desk (built by the host). Entered from the west.
    id: 'control-house', site: 'site-3', kind: 'block',
    room: { x0: -6.8, x1: 6.8, z0: -8.25, z1: 7.4 }, wall: 0.3,
    roof: { type: 'flat', low: 4.9, high: 4.9 },
    walls: { left: true, right: true, back: true, front: true },
    doors: [{ wall: 'left', a: 2.4, b: 4.6, top: 2.4 }],
    slots: [],
    windows: [
      { wall: 'right', a: -1.2, b: 6.2, y0: 1.1, y1: 2.3 },
      { wall: 'front', a: -5.6, b: -1.4, y0: 1.1, y1: 2.3 },
      { wall: 'front', a: 1.4, b: 5.6, y0: 1.1, y1: 2.3 }
    ],
    lamps: [[-2.2, 3.7, 1.8], [2.2, 3.7, 1.8]],
    sky: 0.12
  },
  {
    // THE TOWER BASE HOUSE, a lean-to against the cracking tower's foot. Block plinth, sheet above, the roof
    // rising toward the column; the draw-off line comes in through the back wall.
    id: 'tower-base-house', site: 'site-4', kind: 'plinth',
    room: { x0: -6.0, x1: 6.0, z0: -4.4, z1: 7.4 }, wall: 0.2,
    roof: { type: 'mono-z', low: 5.2, high: 6.6 },
    walls: { left: true, right: true, back: true, front: true },
    doors: [{ wall: 'front', a: -4.8, b: -1.8, top: 3.6 }],
    slots: [],
    windows: [],
    lamps: [[-2.6, 4.7, 1.4], [2.6, 4.7, -1.2]],
    sky: 0.15
  },
  {
    // THE HEAD HOUSE, where the belt delivers: the tall end of the bagging shed, gable ends east and west. The
    // belt comes in through the east gable; the west gable is the wall it shares with the bagging shed, open at
    // its back where the line runs through.
    id: 'head-house', site: 'site-5', kind: 'clad', shed: 'bagging',
    room: { x0: -5.6, x1: 5.69, z0: -6.6, z1: 8.3 }, wall: 0.2,
    roof: { type: 'gable-x', low: 9.2, high: 10.0 },
    walls: { left: true, right: true, back: true, front: true },
    doors: [{ wall: 'right', a: 2.8, b: 6.8, top: 4.2 }],
    slots: [
      { wall: 'right', a: -5.9, b: -3.3, y1: 9.2 },      // the belt (world z 3.1 to 5.7)
      { wall: 'left', a: -6.6, b: -2.0, y1: 5.0 }        // the line on into the bagging shed
    ],
    windows: [],
    lamps: [[-2.8, 6.2, 2.0], [2.8, 6.2, 2.0], [3.6, 6.0, -1.6]],
    sky: 0.2
  },
  {
    // THE BAGGING SHED, a lean-to off the head house's west gable, the roof falling away from it. Its east wall
    // is the head house's; the dock door opens south onto the loadout.
    id: 'bagging-shed', site: 'site-6', kind: 'clad', shed: 'bagging',
    room: { x0: -6.51, x1: 5.6, z0: -6.6, z1: 8.3 }, wall: 0.2,
    roof: { type: 'mono-x', low: 5.6, high: 7.0 },
    walls: { left: true, right: false, back: true, front: true },
    doors: [{ wall: 'front', a: -5.6, b: -1.6, top: 4.0 }],
    slots: [],
    windows: [],
    lamps: [[-2.2, 4.9, 1.8], [2.6, 4.9, -1.4]],
    sky: 0.15
  }
]);

export const hallFor = siteId => HALLS.find(h => h.site === siteId) || null;

/* ------------------------------------------------------------------ frames */

/** Host frame -> world (x, z), for a site that faces `f` (a unit axis). */
export function toWorld(siteId, lx, lz) {
  const { pos, f } = SITE_FRAMES[siteId];
  return [pos[0] + lx * f[1] + lz * f[0], pos[1] - lx * f[0] + lz * f[1]];
}

/** World (x, z) -> host frame. */
export function toLocal(siteId, x, z) {
  const { pos, f } = SITE_FRAMES[siteId];
  const dx = x - pos[0], dz = z - pos[1];
  return [dx * f[1] - dz * f[0], dx * f[0] + dz * f[1]];
}

/** A host-frame rectangle as a world AABB. */
export function rectToWorld(siteId, x0, x1, z0, z1) {
  const pts = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].map(([x, z]) => toWorld(siteId, x, z));
  return {
    minX: Math.min(...pts.map(p => p[0])), maxX: Math.max(...pts.map(p => p[0])),
    minZ: Math.min(...pts.map(p => p[1])), maxZ: Math.max(...pts.map(p => p[1]))
  };
}

/** The outside of a hall's walls (where it does not build a wall, the room's own face), in the host frame. */
export function outerLocal(h) {
  const r = h.room, t = h.wall;
  return {
    x0: r.x0 - (h.walls.left ? t : 0), x1: r.x1 + (h.walls.right ? t : 0),
    z0: r.z0 - (h.walls.back ? t : 0), z1: r.z1 + (h.walls.front ? t : 0)
  };
}

/** The ground a hall covers (its slab), as a world AABB. */
export function hallRect(h) {
  const o = outerLocal(h);
  return rectToWorld(h.site, o.x0, o.x1, o.z0, o.z1);
}

/** The room inside a hall's walls, as a world AABB. */
export function roomRect(h) {
  const r = h.room;
  return rectToWorld(h.site, r.x0, r.x1, r.z0, r.z1);
}

/* ------------------------------------------------------------------ the roof */

/** The underside of the roof over a host-frame point, from the floor. */
export function roofAt(h, lx, lz) {
  const { type, low, high } = h.roof;
  const r = h.room;
  const u = (v, a, b) => Math.min(1, Math.max(0, (v - a) / (b - a)));
  switch (type) {
    case 'gable-z': return low + (high - low) * (1 - Math.abs(2 * u(lx, r.x0, r.x1) - 1));
    case 'gable-x': return low + (high - low) * (1 - Math.abs(2 * u(lz, r.z0, r.z1) - 1));
    case 'mono-z': return high + (low - high) * u(lz, r.z0, r.z1);
    case 'mono-x': return low + (high - low) * u(lx, r.x0, r.x1);
    default: return low;
  }
}

/* ------------------------------------------------------------------ the walls */

const WALLS = ['left', 'right', 'back', 'front'];

/** A wall's line in the host frame: its fixed coordinate, the axis it runs along, and its span. */
export function wallLine(h, wall) {
  const r = h.room, t = h.wall;
  const o = outerLocal(h);
  switch (wall) {
    case 'left': return { axis: 'z', at: r.x0 - t / 2, a0: o.z0, a1: o.z1, out: -1 };
    case 'right': return { axis: 'z', at: r.x1 + t / 2, a0: o.z0, a1: o.z1, out: 1 };
    case 'back': return { axis: 'x', at: r.z0 - t / 2, a0: o.x0, a1: o.x1, out: -1 };
    default: return { axis: 'x', at: r.z1 + t / 2, a0: o.x0, a1: o.x1, out: 1 };
  }
}

/** The height of a wall's top at a point along it (the roof's underside over the wall's inner face). */
export function wallTop(h, wall, a) {
  const r = h.room;
  const c = v => Math.min(Math.max(v, Math.min(r.x0, r.x1)), Math.max(r.x0, r.x1));
  const cz = v => Math.min(Math.max(v, r.z0), r.z1);
  switch (wall) {
    case 'left': return roofAt(h, r.x0, cz(a));
    case 'right': return roofAt(h, r.x1, cz(a));
    case 'back': return roofAt(h, c(a), r.z0);
    default: return roofAt(h, c(a), r.z1);
  }
}

/** Every opening in one wall: `{ a, b, y0, y1, kind }`. */
export function openingsOf(h, wall) {
  const list = [];
  for (const d of h.doors) if (d.wall === wall) list.push({ a: d.a, b: d.b, y0: 0, y1: d.top, kind: 'door' });
  for (const s of h.slots) if (s.wall === wall) list.push({ a: s.a, b: s.b, y0: s.y0 ?? 0, y1: s.y1, kind: 'slot' });
  for (const w of h.windows) if (w.wall === wall) list.push({ a: w.a, b: w.b, y0: w.y0, y1: w.y1, kind: 'window' });
  return list;
}

/**
 * The solid of each wall the hall builds, as strips `{ wall, a0, a1, y0, ya, yb }` from `a0` to `a1` along the
 * wall, from `y0` up to `ya` at `a0` and `yb` at `a1` (a strip under a sloping roof follows it; one under an
 * opening is level). Strips are cut at the wall's ends, at every opening's edges and under the ridge.
 */
export function wallPieces(h) {
  const out = [];
  for (const wall of WALLS) {
    if (!h.walls[wall]) continue;
    const line = wallLine(h, wall);
    const ops = openingsOf(h, wall);
    const r = h.room;
    const cuts = new Set([line.a0, line.a1]);
    for (const o of ops) { cuts.add(Math.max(line.a0, Math.min(line.a1, o.a))); cuts.add(Math.max(line.a0, Math.min(line.a1, o.b))); }
    // The ridge over a gable end, and the inside faces (past which the top is level to the corner).
    if (line.axis === 'x') { cuts.add((r.x0 + r.x1) / 2); cuts.add(r.x0); cuts.add(r.x1); }
    else { cuts.add((r.z0 + r.z1) / 2); cuts.add(r.z0); cuts.add(r.z1); }
    const xs = [...cuts].filter(v => v >= line.a0 && v <= line.a1).sort((p, q) => p - q);
    for (let i = 0; i < xs.length - 1; i++) {
      const a0 = xs[i], a1 = xs[i + 1];
      if (a1 - a0 < 1e-6) continue;
      const mid = (a0 + a1) / 2;
      const ta = wallTop(h, wall, a0), tb = wallTop(h, wall, a1);
      const gaps = ops.filter(o => mid > o.a && mid < o.b).map(o => [o.y0, o.y1]).sort((p, q) => p[0] - q[0]);
      let y = 0;
      for (const [g0, g1] of gaps) {
        if (g0 > y) out.push({ wall, a0, a1, y0: y, ya: g0, yb: g0 });
        y = Math.max(y, g1);
      }
      if (Math.min(ta, tb) > y + 1e-6) out.push({ wall, a0, a1, y0: y, ya: ta, yb: tb });
    }
  }
  return out;
}

/**
 * The hall's colliders in the host frame (`{ lx, lz, hw, hd }`, as a host returns them): every wall along its
 * whole length, less its doors. A slot is closed at the floor: the belt's way through a wall is not the walk's.
 */
export function hallColliders(h) {
  const out = [];
  for (const wall of WALLS) {
    if (!h.walls[wall]) continue;
    const line = wallLine(h, wall);
    const doors = h.doors.filter(d => d.wall === wall).sort((p, q) => p.a - q.a);
    let a = line.a0;
    const runs = [];
    for (const d of doors) { if (d.a > a) runs.push([a, d.a]); a = Math.max(a, d.b); }
    if (line.a1 > a) runs.push([a, line.a1]);
    for (const [a0, a1] of runs) {
      const mid = (a0 + a1) / 2, half = (a1 - a0) / 2, th = h.wall / 2;
      out.push(line.axis === 'x' ? { lx: mid, lz: line.at, hw: half, hd: th } : { lx: line.at, lz: mid, hw: th, hd: half });
    }
  }
  return out;
}

/** Each door's centre a little outside and a little inside its wall, in the world: where the guide turns in. */
export function doorPoints(h, reach = 1.4) {
  return h.doors.map(d => {
    const line = wallLine(h, d.wall);
    const m = (d.a + d.b) / 2;
    const at = off => line.axis === 'x' ? [m, line.at + line.out * off] : [line.at + line.out * off, m];
    const [ox, oz] = at(reach + h.wall / 2), [ix, iz] = at(-(reach + h.wall / 2));
    return { out: toWorld(h.site, ox, oz), in: toWorld(h.site, ix, iz), width: d.b - d.a, top: d.top };
  });
}

/* ------------------------------------------------------------------ cover */

/**
 * The cover mask's boxes for one hall at floor height `floorY` (world): the room up to its lower eaves, and
 * under a pitched roof a second, narrower box up to half the rise, so the roof's underside is covered and its
 * top, a little above the box, stays in the sun.
 */
export function hallCoverBoxes(h, floorY) {
  const r = h.room;
  const { type, low, high } = h.roof;
  const box = (x0, x1, z0, z1, y1) => {
    const w = rectToWorld(h.site, x0, x1, z0, z1);
    return { min: [w.minX, floorY - 0.3, w.minZ], max: [w.maxX, floorY + y1, w.maxZ], sky: h.sky };
  };
  const lowEave = Math.min(low, high);
  const boxes = [box(r.x0, r.x1, r.z0, r.z1, lowEave - 0.15)];
  const rise = Math.abs(high - low);
  if (rise > 0.3) {
    const y1 = lowEave + rise / 2 - 0.15;
    const qx = (r.x1 - r.x0) / 4, qz = (r.z1 - r.z0) / 4;
    if (type === 'gable-z') boxes.push(box(r.x0 + qx, r.x1 - qx, r.z0, r.z1, y1));
    else if (type === 'gable-x') boxes.push(box(r.x0, r.x1, r.z0 + qz, r.z1 - qz, y1));
    else if (type === 'mono-z') boxes.push(box(r.x0, r.x1, r.z0, (r.z0 + r.z1) / 2, y1));
    else if (type === 'mono-x') boxes.push(box((r.x0 + r.x1) / 2, r.x1, r.z0, r.z1, y1));
  }
  return boxes;
}

/** The pit's cover box: its room up to the underside of its roof. */
export function pitCoverBox() {
  const r = PIT.room;
  return { min: [r.minX, PIT.floorY - 0.3, r.minZ], max: [r.maxX, PIT.ceilingY - 0.1, r.maxZ], sky: PIT.sky };
}

/* ------------------------------------------------------------------ the route */

const inside = (r, x, z) => x > r.minX && x < r.maxX && z > r.minZ && z < r.maxZ;

/** The hall (or 'pit') a world point is inside, or null. */
export function placeOf(x, z) {
  for (const h of HALLS) if (inside(roomRect(h), x, z)) return h;
  if (inside(PIT.room, x, z) || inside(PIT.stair, x, z)) return 'pit';
  return null;
}

/** The stair's head and foot, on its centre line, a little past each end. */
function stairPoints() {
  const s = PIT.stair, cx = (s.minX + s.maxX) / 2;
  return { head: [cx, s.maxZ + 1.2], foot: [cx, s.minZ - 1.2] };
}

/**
 * The way on foot from one world point to another, as `[x, z]` waypoints: out of the building (or the pit) the
 * walker is in by its door (or stair), across the pan, and in by the door (or stair) of the one it is going to.
 */
export function routeTo(fx, fz, tx, tz) {
  const from = placeOf(fx, fz), to = placeOf(tx, tz);
  const path = [[fx, fz]];
  if (from !== to) {
    if (from === 'pit') { const s = stairPoints(); path.push(s.foot, s.head); }
    else if (from) { const d = doorPoints(from)[0]; path.push(d.in, d.out); }
    if (to === 'pit') { const s = stairPoints(); path.push(s.head, s.foot); }
    else if (to) { const d = doorPoints(to)[0]; path.push(d.out, d.in); }
  }
  path.push([tx, tz]);
  return path;
}
