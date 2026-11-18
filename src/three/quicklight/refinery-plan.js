/**
 * quicklight/refinery-plan.js — Quicklight's refinery, as plain data and plain functions.
 *
 * NO THREE.JS HERE. The layout generator, the world, the walk, the guide and `verify:quicklight` all stand on this one
 * declaration, so what is walked is what is drawn and what is checked (`docs/plans/quicklight-world.md` section 7).
 *
 * THE GROUND is a young lava field. Two flows lie one on the other: the LOWER FLOW at `GRADE`, and the UPPER FLOW, whose front
 * crosses the site from west to east at `SCARP` and stands `PLOT` metres higher. The refinery is packed onto both: on the lower
 * flow the tank bund, the analyser bunker and the control block; on the upper flow (the REACTOR PLOT) the cracking reactor, the
 * reactor train, the catalyst bunker and the flare yard. North is -z.
 *
 * THE WALK is a GRID OF ALLEYS under pipe racks, as `lib/workings.js` volumes closed on every side that is not a doorway:
 *   yard            the laydown yard at the north-west corner, where the Avalon sets down
 *   b1, b2          the lower grid's two east-west alleys            a1, a2, a3   its three north-south alleys
 *   a2s             the middle alley's run south to the flow front    rise         the ramp up through the flow front, in a cutting
 *   c1, c2          the plot's two east-west alleys                  d1, d2       its two north-south alleys
 *   flare           the flare yard, fenced, entered from c2's east end
 *   down-N, court-N the ramp down and the sunk court in front of a sunk room (benches 1, 3, 6)
 *   door-N, room-N  the passage through a room's wall, and the room of bench N
 *
 * THE HEIGHT FIELD is ONE function: inside a volume its floor; within `EDGE` of an open volume's closed side the same floor
 * (the step to the land is hidden inside the wall or kerb that stands there); everywhere else the land: the two flows and the
 * front between them, the sunk tank bund, the earth banked over the two bunkers, and the lava field to the horizon.
 */

import { makeWorkings, insideRect, floorOf } from '../lib/workings.js';

/** The walk stays in this square about the origin (the stage's bound for every Learn world). */
export const WALK = 100;

/** The levels: the lower flow, the upper flow (the reactor plot), and the three sunk floors. */
export const GRADE = 0;
export const PLOT = 5;
export const CELLAR = -3.5;      // the analyser bunker's floor (bench 1)
export const PIT = -4;           // the tank bund's floor (bench 3)
export const CAT = 2;            // the catalyst bunker's floor (bench 6)
/** The upper flow's front: the land is `GRADE` north of `SCARP.z0` and `PLOT` south of `SCARP.z1`. */
export const SCARP = { z0: 7.0, z1: 9.0 };

/** How far an open volume's floor runs past its closed side (the step to the land is hidden in the kerb or wall there). */
export const EDGE = 0.3;
/** A wall's thickness where a walk is closed by one; a kerb's height and a handrail's. */
export const WALL_T = 0.6;
export const KERB = 0.2;
export const RAIL = 1.1;
/** A passage through a wall: its width, and the lintel over it. */
export const DOOR = { w: 3.6, top: 3.4 };
/** How far in front of the back wall the plate stands. */
export const PLATE_FROM_BACK = 3.0;

/** The plant's footprint: inside it the ground is hardstanding at its flow's level; outside it, the lava field. */
export const PLANT = { minX: -78, maxX: 98, minZ: -100, maxZ: 104 };
/** The sunk tank bund on the lower flow, south of b2. */
export const BUND = { minX: -60, maxX: -14, minZ: -17, maxZ: 5.5, wall: 0.5 };

export const PAD = [-78, -78];
export const SPAWN = [-63, GRADE + 1.6, -68.5];
export const SPAWN_LOOK = [-40, GRADE + 1.4, -68.5];
/** The Flare's ground in the flare yard, the stack to its east. */
export const ARENA = { boss: [68, PLOT, 72], player: [68, PLOT + 1.6, 56] };
/** The flare stack, standing in the yard's south-east. */
export const STACK = { x: 80, z: 82, h: 46 };

/**
 * THE ROOMS, one per bench, in bench order. `rect` is the room's inside; `door` the side its door is in and `onto` the volume
 * it opens onto; `doorT` the thickness of the wall it goes through. `shell` is how `terrain.js` builds it:
 *   arch      a corrugated steel arch under earth (bench 1, the analyser bunker), sunk under the lower flow
 *   block     the control block: blast-resistant concrete, a slab roof on downstand beams, a false ceiling of cable trays
 *   cellar    the pump cellar in the tank bund: a slab on rolled steel beams carrying the manifold deck over it
 *   skirt     inside the cracking reactor's skirt: a round concrete skirt, the reactor's bottom head overhead
 *   table     under the reactor train's concrete table: columns, beams, block infill walls
 *   magazine  the catalyst bunker: a concrete box under earth, a loading hopper through its roof (bench 6)
 * `top` is the clear height over the floor at the plate; `sky` how much of the sky's fill the cover mask leaves; `mound` the
 * earth's top over a bunker (world height).
 */
export const ROOMS = [
  { id: 'room-1', site: 'site-1', rect: { minX: -43.4, maxX: -31, minZ: -46.2, maxZ: -34.2 }, floor: CELLAR, door: 'maxX', onto: 'court-1', doorT: 1.0, shell: 'arch', top: 4.8, sky: 0.12, mound: 3.0 },
  { id: 'room-2', site: 'site-2', rect: { minX: -2, maxX: 11, minZ: -53, maxZ: -40 }, floor: GRADE, door: 'minX', onto: 'a2', doorT: 1.0, shell: 'block', top: 4.6, sky: 0.15 },
  { id: 'room-3', site: 'site-3', rect: { minX: -62.8, maxX: -50.8, minZ: -12.4, maxZ: -0.4 }, floor: PIT, door: 'maxX', onto: 'court-3', doorT: 0.8, shell: 'cellar', top: 4.7, sky: 0.15 },
  { id: 'room-4', site: 'site-4', rect: { minX: -31.2, maxX: -18.8, minZ: 21.2, maxZ: 34 }, floor: PLOT, door: 'maxZ', onto: 'c1', doorT: 4.0, shell: 'skirt', top: 6.2, sky: 0.12 },
  { id: 'room-5', site: 'site-5', rect: { minX: 18, maxX: 36, minZ: 25, maxZ: 37.2 }, floor: PLOT, door: 'maxZ', onto: 'c1', doorT: 0.8, shell: 'table', top: 5.0, sky: 0.2 },
  { id: 'room-6', site: 'site-6', rect: { minX: -37, maxX: -25, minZ: 50, maxZ: 62 }, floor: CAT, door: 'maxX', onto: 'court-6', doorT: 1.0, shell: 'magazine', top: 4.6, sky: 0.12, mound: 9.8 }
];

/** The cracking reactor's skirt round room 4: its centre and its inside radius (it takes in the room's corners). */
export const SKIRT = { x: -25, z: 27.6, r: 9.1, t: 0.5 };
/** The roof's least thickness over a room. */
export const ROOF_T = 0.3;
/** How much of the sky the passages keep. */
const DOOR_SKY = 0.35;

const smooth = (a, b, t) => { const x = Math.max(0, Math.min(1, (t - a) / (b - a))); return x * x * (3 - 2 * x); };
const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
function vnoise(x, z) {
  const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j;
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, z, n = 4) {
  let s = 0, a = 0.5;
  for (let i = 0; i < n; i++) { s += a * vnoise(x, z); x = x * 2.03 + 7.1; z = z * 2.03 - 3.3; a *= 0.5; }
  return s;
}

/* ================================================================== the land */

/** Where the upper flow's front stands at x: straight across the plant, lobed beyond it. */
export function frontZ(x) {
  const out = Math.max(0, PLANT.minX - x, x - PLANT.maxX);
  return SCARP.z0 + (Math.sin(x * 0.021) * 26 + Math.sin(x * 0.047 + 1.3) * 11 + (fbm(x * 0.01, 3.1) - 0.5) * 30) * smooth(0, 60, out);
}

/** The lava field outside the plant: pahoehoe swells on both flows, the upper flow's front, ridges and the far cones. */
function lavaField(x, z) {
  const f = frontZ(x);
  // Pressure ridges and tumuli: low swells a metre or two high, in lines across the flow.
  const swell = (fbm(x * 0.045, z * 0.045) - 0.45) * 2.4 + Math.max(0, Math.sin(x * 0.06 + z * 0.02 + fbm(x * 0.02, z * 0.02) * 4)) * 0.9;
  const lower = GRADE + swell;
  const upper = PLOT + swell * 1.2;
  // The front: 2 to 5 m of steep rubble, steeper where it is young.
  const t = smooth(f - 1.2, f + 2.2, z);
  let y = lower + (upper - lower) * t;
  // Far off, the land rises to the shield's flanks in the east and old cones in the west and the north.
  const r = Math.hypot(x, z);
  y += smooth(260, 900, r) * (40 + fbm(x * 0.004, z * 0.004) * 90);
  return y;
}

/** The earth banked over a bunker: a rounded heap over the room and 5 m round it, cut sharp at the face its door is in. */
function moundAt(room, x, z) {
  if (!room.mound) return -Infinity;
  const r = room.rect;
  const cut = room.door === 'maxX' ? r.maxX + room.doorT : null;
  if (cut !== null && x > cut + 1e-6) return -Infinity;
  const dx = Math.max(r.minX - x, 0, cut !== null ? 0 : x - r.maxX);
  const dz = Math.max(r.minZ - z, 0, z - r.maxZ);
  const d = Math.hypot(dx, dz);
  const base = room.floor === CELLAR ? GRADE : PLOT;
  if (d > 6.5) return -Infinity;
  const crown = room.mound + (fbm(x * 0.3, z * 0.3) - 0.5) * 0.3;
  return base + (crown - base) * (1 - smooth(0.8, 6.5, d));
}

/** The laydown yard's corner of the plant, west of the main fence line. */
export const PLANT_YARD = { minX: -100, maxX: PLANT.minX, minZ: -100, maxZ: -52 };
/** Is (x, z) in the plant's hardstanding (as against the lava field round it)? */
export const inPlant = (x, z) => (x >= PLANT.minX && x <= PLANT.maxX && z >= PLANT.minZ && z <= PLANT.maxZ)
  || (x >= PLANT_YARD.minX && x <= PLANT_YARD.maxX && z >= PLANT_YARD.minZ && z <= PLANT_YARD.maxZ);
/** How far (x, z) lies outside the plant's hardstanding. */
function outside(x, z) {
  const d = r => Math.hypot(Math.max(r.minX - x, 0, x - r.maxX), Math.max(r.minZ - z, 0, z - r.maxZ));
  return Math.min(d(PLANT), d(PLANT_YARD));
}

/** The land with no walk on it. */
export function land(x, z) {
  let y;
  if (inPlant(x, z)) {
    // Hardstanding on each flow; the front between them is a cut face of the flow, 2 m wide, filled to the plot behind.
    y = GRADE + (PLOT - GRADE) * smooth(SCARP.z0, SCARP.z1, z);
    if (x >= BUND.minX - BUND.wall && x <= BUND.maxX + BUND.wall && z >= BUND.minZ - BUND.wall && z <= BUND.maxZ + BUND.wall) {
      const inside = x >= BUND.minX && x <= BUND.maxX && z >= BUND.minZ && z <= BUND.maxZ;
      y = inside ? PIT : GRADE + 0.6;
    }
  } else {
    // The lava field, graded down to the hardstanding's level over the first 8 m outside it.
    const flat = GRADE + (PLOT - GRADE) * smooth(SCARP.z0, SCARP.z1, z);
    y = flat + (lavaField(x, z) - flat) * smooth(0, 8, outside(x, z));
  }
  for (const room of ROOMS) y = Math.max(y, moundAt(room, x, z));
  return y;
}

/* ================================================================== the volumes */

const rect = (minX, maxX, minZ, maxZ) => ({ minX, maxX, minZ, maxZ });
const r2 = n => Math.round(n * 100) / 100;

/** The span of a room's door: across the middle of its door side. */
export function doorSpan(room) {
  const r = room.rect;
  const mid = room.door === 'minX' || room.door === 'maxX' ? (r.minZ + r.maxZ) / 2 : (r.minX + r.maxX) / 2;
  return [r2(mid - DOOR.w / 2), r2(mid + DOOR.w / 2)];
}

/** The alleys, the ramps, the courts: every open volume. */
function openVolumes() {
  const V = [];
  const add = (id, kind, rc, floor) => { const v = { id, kind, rect: rc, floor, openings: [] }; V.push(v); return v; };
  const flat = y => ({ y0: y });
  // The lower grid.
  add('yard', 'yard', rect(-92, -60, -92, -56), flat(GRADE));
  add('b1', 'alley', rect(-60, 60, -72, -65), flat(GRADE));
  add('a1', 'alley', rect(-60, -53, -65, -26), flat(GRADE));
  add('a2', 'alley', rect(-10, -3, -65, -26), flat(GRADE));
  add('a3', 'alley', rect(53, 60, -65, -26), flat(GRADE));
  add('b2', 'alley', rect(-60, 60, -26, -19), flat(GRADE));
  add('a2s', 'alley', rect(-10, -3, -19, 8), flat(GRADE));
  add('rise', 'ramp', rect(-10, -3, 8, 38), { y0: GRADE, y1: PLOT, axis: 'z', from: 8, to: 38 });
  // The plot.
  add('c1', 'alley', rect(-60, 60, 38, 45), flat(PLOT));
  add('d1', 'alley', rect(-60, -53, 45, 80), flat(PLOT));
  add('d2', 'alley', rect(7, 14, 45, 80), flat(PLOT));
  add('c2', 'alley', rect(-60, 40, 80, 87), flat(PLOT));
  add('flare', 'yard', rect(40, 86, 52, 90), flat(PLOT));
  // The descents to the sunk rooms: a ramp and a level court at the room's floor.
  add('down-1', 'ramp', rect(-30, -24, -65, -44), { y0: GRADE, y1: CELLAR, axis: 'z', from: -65, to: -44 });
  add('court-1', 'court', rect(-30, -24, -44, -35), flat(CELLAR));
  add('down-3', 'ramp', rect(-34, -10, -9, -3), { y0: PIT, y1: GRADE, axis: 'x', from: -34, to: -10 });
  add('court-3', 'court', rect(-50, -34, -13, 1), flat(PIT));
  add('down-6', 'ramp', rect(-24, -18, 62, 80), { y0: CAT, y1: PLOT, axis: 'z', from: 62, to: 80 });
  add('court-6', 'court', rect(-24, -18, 50, 62), flat(CAT));
  return V;
}

/** Two volumes that share a plane, joined across `[lo, hi]` of it. */
const LINKS = [
  ['yard', 'maxX', 'b1', 'minX', -72, -65], ['yard', 'maxX', 'a1', 'minX', -65, -56],
  ['b1', 'maxZ', 'a1', 'minZ', -60, -53], ['b1', 'maxZ', 'a2', 'minZ', -10, -3], ['b1', 'maxZ', 'a3', 'minZ', 53, 60],
  ['b1', 'maxZ', 'down-1', 'minZ', -30, -24],
  ['a1', 'maxZ', 'b2', 'minZ', -60, -53], ['a2', 'maxZ', 'b2', 'minZ', -10, -3], ['a3', 'maxZ', 'b2', 'minZ', 53, 60],
  ['b2', 'maxZ', 'a2s', 'minZ', -10, -3],
  ['a2s', 'maxZ', 'rise', 'minZ', -10, -3],
  ['a2s', 'minX', 'down-3', 'maxX', -9, -3],
  ['down-3', 'minX', 'court-3', 'maxX', -9, -3],
  ['down-1', 'maxZ', 'court-1', 'minZ', -30, -24],
  ['rise', 'maxZ', 'c1', 'minZ', -10, -3],
  ['c1', 'maxZ', 'd1', 'minZ', -60, -53], ['c1', 'maxZ', 'd2', 'minZ', 7, 14],
  ['d1', 'maxZ', 'c2', 'minZ', -60, -53], ['d2', 'maxZ', 'c2', 'minZ', 7, 14],
  ['c2', 'minZ', 'down-6', 'maxZ', -24, -18],
  ['down-6', 'minZ', 'court-6', 'maxZ', -24, -18],
  ['c2', 'maxX', 'flare', 'minX', 80, 87]
];

const OPPOSITE = { minX: 'maxX', maxX: 'minX', minZ: 'maxZ', maxZ: 'minZ' };

function buildVolumes() {
  const vols = openVolumes();
  const byId = new Map(vols.map(v => [v.id, v]));
  const open = (side, lo, hi, to) => ({ side, lo, hi, to });
  for (const [a, sa, b, sb, lo, hi] of LINKS) {
    byId.get(a).openings.push(open(sa, lo, hi, b));
    byId.get(b).openings.push(open(sb, lo, hi, a));
  }
  // The rooms and the passages into them.
  for (const r of ROOMS) {
    const n = r.id.slice(5);
    const [lo, hi] = doorSpan(r);
    const R = r.rect, t = r.doorT, s = r.door;
    let pr;
    if (s === 'maxX') pr = rect(R.maxX, r2(R.maxX + t), lo, hi);
    else if (s === 'minX') pr = rect(r2(R.minX - t), R.minX, lo, hi);
    else if (s === 'maxZ') pr = rect(lo, hi, R.maxZ, r2(R.maxZ + t));
    else pr = rect(lo, hi, r2(R.minZ - t), R.minZ);
    vols.push({ id: `door-${n}`, kind: 'passage', rect: pr, floor: { y0: r.floor }, roof: DOOR.top, openings: [open(OPPOSITE[s], lo, hi, r.id), open(s, lo, hi, r.onto)] });
    vols.push({ id: r.id, kind: 'room', rect: { ...R }, floor: { y0: r.floor }, roof: r.top, openings: [open(s, lo, hi, `door-${n}`)], room: r });
    byId.get(r.onto).openings.push(open(OPPOSITE[s], lo, hi, `door-${n}`));
  }
  return vols;
}

export const OPEN_KINDS = ['yard', 'alley', 'ramp', 'court'];

/**
 * The plan. Everything is derived from the tables above.
 */
export function makeRefineryPlan() {
  const work = makeWorkings(buildVolumes(), { openKinds: OPEN_KINDS, roof: 4.4, wallInner: 0.3, wallDepth: 0.6, jamb: 0.5, outdoorDoors: true });
  const { volumes, byId } = work;
  const openVols = volumes.filter(v => OPEN_KINDS.includes(v.kind));
  const roofed = volumes.filter(v => !OPEN_KINDS.includes(v.kind));
  const rooms = ROOMS.map(r => ({ ...r, vol: byId.get(r.id), doorVol: byId.get(`door-${r.id.slice(5)}`), level: r.floor }));
  const roomById = new Map(rooms.map(r => [r.id, r]));

  /** An open volume whose floor runs out under (x, z): inside it, or within `EDGE` of one of its closed sides. */
  function edgeVolume(x, z) {
    for (const v of openVols) {
      const r = v.rect;
      if (x < r.minX - EDGE || x > r.maxX + EDGE || z < r.minZ - EDGE || z > r.maxZ + EDGE) continue;
      return v;
    }
    return null;
  }

  /** THE HEIGHT FIELD. */
  function height(x, z) {
    const v = work.volumeAt(x, z);
    if (v) return floorOf(v, x, z);
    const e = edgeVolume(x, z);
    if (e) return floorOf(e, Math.min(e.rect.maxX - 1e-6, Math.max(e.rect.minX, x)), Math.min(e.rect.maxZ - 1e-6, Math.max(e.rect.minZ, z)));
    return land(x, z);
  }

  /** The roofed volume a point stands in. */
  function inRoofed(x, z) {
    for (const v of roofed) if (insideRect(v.rect, x, z)) return v;
    return null;
  }

  /** Is a roofed volume under the earth of a bunker (so the ground mesh runs over it)? */
  const underEarth = v => {
    const room = v.kind === 'room' ? v.room : rooms.find(r => r.doorVol === v);
    return Boolean(room?.mound);
  };

  /** The walls of every volume, as `lib/workings.js` draws them, and their colliders. */
  const colliders = () => work.wallColliders();

  /** The lines the ground mesh must have a vertex row on, so each step is a sharp edge inside the body that hides it. */
  function breaks() {
    const xs = new Set(), zs = new Set();
    const both = (set, at) => { set.add(r2(at)); set.add(r2(at - 0.03)); set.add(r2(at + 0.03)); };
    for (const x of [BUND.minX, BUND.maxX, BUND.minX - BUND.wall, BUND.maxX + BUND.wall, PLANT.minX, PLANT.maxX]) both(xs, x);
    for (const z of [BUND.minZ, BUND.maxZ, BUND.minZ - BUND.wall, BUND.maxZ + BUND.wall, PLANT.minZ, PLANT.maxZ]) both(zs, z);
    // The flow front: a row every quarter metre down its face, so it shows in section.
    for (let z = SCARP.z0; z <= SCARP.z1 + 1e-6; z += 0.25) zs.add(r2(z));
    for (const r of rooms) if (r.mound) { const x = r.rect.maxX + r.doorT; both(xs, x); }
    for (const v of volumes) {
      const r = v.rect;
      for (const x of [r.minX, r.maxX]) { xs.add(x); xs.add(r2(x - EDGE)); xs.add(r2(x + EDGE)); xs.add(r2(x - EDGE - 0.06)); xs.add(r2(x + EDGE + 0.06)); }
      for (const z of [r.minZ, r.maxZ]) { zs.add(z); zs.add(r2(z - EDGE)); zs.add(r2(z + EDGE)); zs.add(r2(z - EDGE - 0.06)); zs.add(r2(z + EDGE + 0.06)); }
    }
    return { xs: [...xs], zs: [...zs] };
  }

  /** THE COVER: every room and every passage is roofed (the sun and most of the sky taken out). No window lets the sun in. */
  function coverSpec() {
    const boxes = [];
    for (const v of roofed) {
      const r = v.rect;
      const top = v.kind === 'room' ? v.room.top + 0.6 : DOOR.top + 0.4;
      const sky = v.kind === 'room' ? v.room.sky : DOOR_SKY;
      const lo = v.floor.y0;
      boxes.push({ id: v.id, min: [r.minX - 0.05, lo - 0.3, r.minZ - 0.05], max: [r.maxX + 0.05, lo + top + 0.3, r.maxZ + 0.05], sky });
    }
    return { boxes, openings: [] };
  }

  /* ================================================================ the way */

  const volumeAt = (x, z) => work.volumeAt(x, z);
  const IN = 2.5;
  function sideOf(v, p) {
    const r = v.rect, e = 0.05;
    if (Math.abs(p[0] - r.minX) < e) return 'minX';
    if (Math.abs(p[0] - r.maxX) < e) return 'maxX';
    if (Math.abs(p[1] - r.minZ) < e) return 'minZ';
    if (Math.abs(p[1] - r.maxZ) < e) return 'maxZ';
    return null;
  }
  const inward = { minX: [1, 0], maxX: [-1, 0], minZ: [0, 1], maxZ: [0, -1] };

  /**
   * The way on foot from (fx, fz) to (tx, tz), as [x, z] points: door by door (`lib/workings.js`). In every volume it
   * crosses it stands off each doorway square to it, so it never runs down a wall or grazes a jamb.
   */
  function routeTo(fx, fz, tx, tz) {
    const pts = work.routeTo(fx, fz, tx, tz);
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const a = out[out.length - 1], b = pts[i];
      // The volume this leg crosses: the one its middle lies in (a leg along a shared plane belongs to the side it is on).
      const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
      const v = volumeAt(mx, mz) || [[0.1, 0], [-0.1, 0], [0, 0.1], [0, -0.1]].map(([dx, dz]) => volumeAt(mx + dx, mz + dz)).find(q => q && OPEN_KINDS.includes(q.kind)) || null;
      if (v) {
        const r = v.rect;
        const lead = (p) => {
          const s = sideOf(v, p);
          if (!s) return null;
          const [dx, dz] = inward[s];
          const room = dx ? r.maxX - r.minX : r.maxZ - r.minZ;
          if (room < 3) return null;
          const k = Math.min(IN, room / 2);
          return [p[0] + dx * k, p[1] + dz * k];
        };
        const la = lead(a), lb = lead(b);
        if (la) out.push(la);
        if (lb && !(la && Math.hypot(la[0] - lb[0], la[1] - lb[1]) < 0.01)) out.push(lb);
      }
      out.push(b);
    }
    return out.filter((p, i) => i === 0 || Math.hypot(p[0] - out[i - 1][0], p[1] - out[i - 1][1]) > 0.01);
  }

  /** The plan's own consistency. */
  function problems() {
    const out = [];
    for (const r of rooms) {
      const v = r.vol.rect;
      const across = v.maxZ - v.minZ, deep = v.maxX - v.minX;
      if (Math.min(across, deep) < 11 || Math.max(across, deep) < 11.2 || r.top < 4.4) out.push(`${r.id}: ${across} x ${deep} m with ${r.top} m over the floor, under 11.2 x 11 x 4.4`);
      const d = r.doorVol.rect, o = byId.get(r.onto).rect;
      const alongZ = r.door === 'minX' || r.door === 'maxX';
      const [dlo, dhi] = alongZ ? [d.minZ, d.maxZ] : [d.minX, d.maxX];
      const [olo, ohi] = alongZ ? [o.minZ, o.maxZ] : [o.minX, o.maxX];
      if (dlo < olo + 1 || dhi > ohi - 1) out.push(`${r.id}: its door does not open onto ${r.onto} with a metre each side`);
      if (Math.abs(byId.get(r.onto).floor.y0 - r.level) > 1e-6 || byId.get(r.onto).floor.y1 !== undefined) out.push(`${r.id}: ${r.onto} is not level with its floor`);
      if (r.mound && r.mound < r.level + r.top + ROOF_T + 1.0) out.push(`${r.id}: under less than a metre of earth`);
    }
    // The skirt takes in room 4's corners and keeps off c1 and the rise.
    {
      const r = ROOMS[3].rect;
      const far = Math.max(...[[r.minX, r.minZ], [r.maxX, r.minZ], [r.minX, r.maxZ], [r.maxX, r.maxZ]].map(([x, z]) => Math.hypot(x - SKIRT.x, z - SKIRT.z)));
      if (far > SKIRT.r - 0.05) out.push(`room-4: its corners (${far.toFixed(2)} m out) reach the skirt (${SKIRT.r} m)`);
      if (SKIRT.z + SKIRT.r + SKIRT.t > byId.get('c1').rect.minZ - WALL_T) out.push('room-4: its skirt reaches c1');
      if (SKIRT.x + SKIRT.r + SKIRT.t > byId.get('rise').rect.minX - WALL_T - 1) out.push('room-4: its skirt reaches the rise');
      if (SKIRT.z - SKIRT.r - SKIRT.t < SCARP.z1 + 1) out.push('room-4: its skirt stands on the flow front');
    }
    for (let i = 0; i < rooms.length; i++) for (let j = i + 1; j < rooms.length; j++) {
      const a = rooms[i].vol.rect, b = rooms[j].vol.rect;
      if (a.minX < b.maxX + 2 && b.minX < a.maxX + 2 && a.minZ < b.maxZ + 2 && b.minZ < a.maxZ + 2) out.push(`${rooms[i].id} and ${rooms[j].id} are less than 2 m apart`);
    }
    for (let i = 0; i < volumes.length; i++) for (let j = i + 1; j < volumes.length; j++) {
      const a = volumes[i].rect, b = volumes[j].rect;
      if (a.minX < b.maxX - 1e-6 && b.minX < a.maxX - 1e-6 && a.minZ < b.maxZ - 1e-6 && b.minZ < a.maxZ - 1e-6) out.push(`${volumes[i].id} and ${volumes[j].id} overlap`);
    }
    // Two volumes side by side that are not joined stand at least a wall's thickness apart, so each has its own wall.
    for (let i = 0; i < volumes.length; i++) for (let j = i + 1; j < volumes.length; j++) {
      const A = volumes[i], B = volumes[j], a = A.rect, b = B.rect;
      if (!OPEN_KINDS.includes(A.kind) || !OPEN_KINDS.includes(B.kind)) continue;
      const joined = A.openings.some(o => o.to === B.id);
      if (joined) continue;
      const gx = Math.max(b.minX - a.maxX, a.minX - b.maxX), gz = Math.max(b.minZ - a.maxZ, a.minZ - b.maxZ);
      if (Math.max(gx, gz) < 2 * WALL_T - 1e-6 && Math.max(gx, gz) > -1e-6 && !(gx > 0 && gz > 0)) out.push(`${A.id} and ${B.id} are ${Math.max(gx, gz).toFixed(2)} m apart and not joined`);
    }
    for (const v of volumes) {
      const r = v.rect;
      if (Math.abs(r.minX) > WALK - 4 || Math.abs(r.maxX) > WALK - 4 || Math.abs(r.minZ) > WALK - 4 || Math.abs(r.maxZ) > WALK - 4) out.push(`${v.id} reaches outside the walk's square`);
    }
    // Every opening is answered on the other side.
    for (const v of volumes) for (const o of v.openings) {
      if (!o.to) continue;
      const w = byId.get(o.to);
      if (!w || !w.openings.some(p => p.to === v.id && Math.abs(p.lo - o.lo) < 1e-6 && Math.abs(p.hi - o.hi) < 1e-6)) out.push(`${v.id} opens onto ${o.to}, which does not open back`);
    }
    // A ramp is no steeper than 1 in 6.
    for (const v of volumes) {
      const f = v.floor;
      if (f.y1 === undefined) continue;
      const g = Math.abs(f.y1 - f.y0) / Math.abs(f.to - f.from);
      if (g > 1 / 6 + 1e-6) out.push(`${v.id} is steeper than 1 in 6 (1 in ${(1 / g).toFixed(1)})`);
    }
    return out;
  }

  const b = volumes.reduce((a, v) => ({ minX: Math.min(a.minX, v.rect.minX), maxX: Math.max(a.maxX, v.rect.maxX), minZ: Math.min(a.minZ, v.rect.minZ), maxZ: Math.max(a.maxZ, v.rect.maxZ) }), { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity });

  return {
    work, volumes, byId, rooms, roomById, roofed, openVols, bounds: b,
    height, land, inRoofed, underEarth, colliders, breaks, coverSpec, routeTo, problems, volumeAt
  };
}

export { r2, smooth };
