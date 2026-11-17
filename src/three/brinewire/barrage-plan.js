/**
 * brinewire/barrage-plan.js — Brinewire's tidal barrage, as plain data and plain functions.
 *
 * NO THREE.JS HERE. The layout generator, the world, the walk, the guide and `verify:brinewire` all stand on this one
 * declaration, so what is walked is what is drawn and what is checked (`docs/plans/brinewire-world.md` section 9).
 *
 * THE WALL runs north and south (north is -z) across the marsh between two headlands. West of it the LAGOON: impounded
 * brine standing at `LAGOON.water`, 1.8 m under the crest. East of it the DROP: the tailrace basin and the tidal flats,
 * 12 m down. On top of the wall the CREST ROAD (x -34 to -24) between two parapets; east of the road the wall's DECK
 * (top `DECK`), which is never walked; under the deck, at `GALLERY`, the cell gallery. The wall's east face is at x 4.
 *
 * THE WALK is a set of `lib/workings.js` volumes, closed on every side that is not a doorway:
 *   yard-n    the north abutment, where the Avalon sets down          road     the crest road
 *   door-N    a passage through a wall (a parapet, the gallery's wall, the cage's mesh)
 *   room-N    the room of bench N: two gate houses standing off the road over the lagoon on piers, three cell chambers
 *             off the gallery, the switchyard's cage at the foot
 *   yard-s    the south abutment                                       ramp-1, ramp-2   the ramp down the east face
 *   landing   half way down the ramp, at the gallery's level           adit     from the landing into the wall
 *   gallery   the cell gallery inside the wall                         apron-w, apron-nw, apron   the foot
 *
 * THE HEIGHT FIELD is ONE function: inside a volume its floor; within `EDGE` of an open volume's closed side the same
 * floor (the step to the land is hidden inside the wall that stands there); everywhere else the land: the wall's crest and
 * deck, the lagoon's bed, the basin's bed, the tidal flats, the headlands, and the far shores.
 */

import { makeWorkings, insideRect, floorOf } from '../lib/workings.js';

/** The walk stays in this square about the origin (the stage's bound for every Learn world). */
export const WALK = 100;

/** Walking levels: the crest, the gallery, the foot. */
export const CREST = 12;
export const GALLERY = 6;
export const FOOT = 0;
/** The deck's top: the wall east of the road, over the gallery. */
export const DECK = 12.6;
/** The lagoon (west) and the tailrace basin and flats (east). */
export const LAGOON = { water: 10.2, bed: 4.0 };
export const BASIN = { water: -1.6, bed: -3.5 };
export const FLATS = -1.2;

/** The wall: its west face (under the road's west parapet), the road, the deck, the east face. */
export const WALL = { west: -34.6, roadW: -34, roadE: -24, deckW: -23.4, east: 4, north: -95, south: 62 };
/** The parapets' height over the walk, and a wall's thickness where the walk is closed by one. */
export const PARAPET = 1.1;
export const WALL_T = 0.6;
/** How far an open volume's floor runs into the wall that closes it (the step is hidden there). */
export const EDGE = 0.3;

/** The north and south abutment yards, the ramp's line, the landing, the foot. */
export const YARD_N = { minX: -52, maxX: -24, minZ: -95, maxZ: -66 };
export const YARD_S = { minX: -34, maxX: 10, minZ: 62, maxZ: 78 };
export const RAMP = { minX: 4, maxX: 10, top: 62, landN: 2, landS: 14, foot: -46 };
export const APRON = { minX: 4, maxX: 46, minZ: -92, maxZ: -46 };
export const GALLERY_RECT = { minX: -8, maxX: -3, minZ: -34, maxZ: 30 };
export const ADIT = { minX: -3, maxX: 4, minZ: 6, maxZ: 10 };

export const PAD = [-38, -82];
export const SPAWN = [-29, CREST + 1.6, -67];
export const SPAWN_LOOK = [-29, CREST + 1.2, -50];
/** The Clamp's ground on the apron, the wall to its west, the tailrace basin to its south. */
export const ARENA = { boss: [34, FOOT, -74], player: [34, FOOT + 1.6, -58] };

/** A passage through a wall: its width, and the lintel over it. */
export const DOOR = { w: 3.6, top: 3.4 };
/** How far in front of the back wall the plate stands. */
export const PLATE_FROM_BACK = 3.0;

/**
 * THE ROOMS, one per bench, in bench order. `rect` is the room's inside; every room's door is in its east side (`maxX`)
 * and opens onto `onto`; `doorT` is the thickness of the wall it goes through. `shell` is how `terrain.js` builds it:
 *   gable    a gate house over the lagoon: block walls, a gabled steel-truss roof
 *   mono     a gate house over the lagoon: a monopitch roof rising to the lagoon side
 *   vault    a cell chamber under a barrel vault running east and west
 *   beams    a cell chamber under a slab on rolled steel beams
 *   hall     the battery hall: a tall slab with a crane runway under it
 *   cage     the switchyard's cage: steel stanchions, expanded-metal mesh, a lean-to sheet roof rising to the wall
 * `top` is the clear height over the floor at the plate; `ridge` the highest a roof reaches; `sky` how much of the sky's fill
 * the cover mask leaves; `window` the opening in the room's south wall the low sun comes in by (its x span, and its sill and
 * head over the floor), if any: the sun stands in the west-south-west, so its light crosses the floor toward the door.
 */
export const ROOMS = [
  { id: 'room-1', site: 'site-1', rect: { minX: -47.6, maxX: -34.6, minZ: -42, maxZ: -29 }, floor: CREST, onto: 'road', doorT: 0.6, shell: 'gable', top: 6.4, ridge: 8.6, sky: 0.3, window: { x: [-46.4, -42.4], y: [2.0, 3.6] } },
  { id: 'room-2', site: 'site-2', rect: { minX: -46.2, maxX: -34.6, minZ: -14, maxZ: -1.6 }, floor: CREST, onto: 'road', doorT: 0.6, shell: 'mono', top: 4.8, ridge: 6.6, sky: 0.3, window: { x: [-45.0, -41.0], y: [2.0, 3.6] } },
  { id: 'room-3', site: 'site-3', rect: { minX: -21.4, maxX: -8.8, minZ: 14, maxZ: 27.4 }, floor: GALLERY, onto: 'gallery', doorT: 0.8, shell: 'vault', top: 5.4, sky: 0.12 },
  { id: 'room-4', site: 'site-4', rect: { minX: -20.4, maxX: -8.8, minZ: -8.6, maxZ: 3.0 }, floor: GALLERY, onto: 'gallery', doorT: 0.8, shell: 'beams', top: 4.6, sky: 0.12 },
  { id: 'room-5', site: 'site-5', rect: { minX: -21.4, maxX: -8.8, minZ: -32, maxZ: -19 }, floor: GALLERY, onto: 'gallery', doorT: 0.8, shell: 'hall', top: 6.0, sky: 0.12 },
  { id: 'room-6', site: 'site-6', rect: { minX: 4.6, maxX: 17.6, minZ: -80, maxZ: -67 }, floor: FOOT, onto: 'apron', doorT: 0.6, shell: 'cage', top: 5.2, ridge: 6.4, sky: 0.5 }
];

/** The roof slab's least thickness over a chamber in the wall, and the deck's own slab over it all. */
export const ROOF_T = 0.2;
export const DECK_SLAB = 0.4;
/** How much of the sky the passages, the gallery and the adit keep. */
const DOOR_SKY = 0.4;
const GALLERY_SKY = 0.12;

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

/** The north headland's rock, rising north of the yards and the apron (0 where there is none). */
function headlandN(x, z) {
  // Metres north of the wall's end, or east of the wall, of the apron's back wall.
  const d = (x > WALL.east ? APRON.minZ - WALL_T : WALL.north) - z;
  if (d <= 0) return -Infinity;
  const across = 1 - smooth(70, 160, Math.abs(x + 10));   // it runs out into the lagoon and the flats
  const rise = 14.5 + Math.min(d, 4) * 2.2 + Math.max(0, d - 4) * 0.42 + fbm(x * 0.03, z * 0.03) * 12 * smooth(0, 30, d);
  return -60 + (rise + 60) * across;
}
/** The south headland's rock, rising south of the south yard. */
function headlandS(x, z) {
  const d = z - YARD_S.maxZ;
  if (d <= 0) return -Infinity;
  const across = 1 - smooth(60, 150, Math.abs(x + 12));
  const rise = 14 + Math.min(d, 4) * 2.0 + Math.max(0, d - 4) * 0.36 + fbm(x * 0.03 + 9, z * 0.03) * 10 * smooth(0, 30, d);
  return -60 + (rise + 60) * across;
}

/** The lagoon's bed west of the wall, shoaling to a far shore under the hills. */
function lagoonBed(x, z) {
  const out = WALL.west - x;
  const far = -x - 560;
  let y = LAGOON.bed - smooth(0, 40, out) * 1.5 + (fbm(x * 0.02, z * 0.02) - 0.5) * 1.6 * smooth(10, 60, out);
  if (far > 0) y += far * 0.12 * smooth(0, 120, far) + fbm(x * 0.006, z * 0.006) * 70 * smooth(40, 340, far);
  return y;
}

/** East of the wall: the tailrace basin (dredged), then the tidal flats, mud bars and channels, and the far low shore. */
function eastLand(x, z) {
  // The basin: from the ramp's wall and the apron's quay east to where the flats begin.
  const basin = x < 72 && z > APRON.maxZ - 0.6 && z < 92;
  const flats = FLATS + (fbm(x * 0.04, z * 0.04) - 0.55) * 1.2 - Math.exp(-Math.pow((z - 12 - Math.sin(x * 0.02) * 30) / 9, 2)) * 1.8 * smooth(60, 120, x);
  let y = basin ? BASIN.bed + smooth(52, 72, x) * (flats - BASIN.bed) : flats;
  const far = x - 520;
  if (far > 0) y += far * 0.05 * smooth(0, 200, far) + fbm(x * 0.008, z * 0.008) * 24 * smooth(60, 400, far);
  return y;
}

/** The land with no walk on it: the wall, the lagoon, the drop, the headlands. */
export function land(x, z) {
  let y;
  if (x < WALL.west && !(z < YARD_N.maxZ && x >= YARD_N.minX - WALL_T)) y = lagoonBed(x, z);
  else if (x <= WALL.east) {
    // On the wall: the crest under the road and the yards, the deck east of the road.
    if (z >= YARD_S.minZ) y = CREST;
    else if (x < WALL.deckW || (z < YARD_N.maxZ && x < YARD_N.maxX + WALL_T)) y = CREST;
    else y = DECK;
  } else if (z < APRON.maxZ && z > APRON.minZ - WALL_T && x < APRON.maxX + WALL_T) y = FOOT;
  else y = eastLand(x, z);
  // The south yard stands on the abutment over the basin: east of it is the drop.
  if (z >= YARD_S.minZ && x > YARD_S.maxX + EDGE && z < YARD_S.maxZ + WALL_T) y = eastLand(x, z);
  // The yards' far sides over the lagoon.
  if (z >= YARD_S.minZ && x < YARD_S.minX - WALL_T && z < YARD_S.maxZ + WALL_T) y = lagoonBed(x, z);
  if (z < YARD_N.maxZ && x < YARD_N.minX - WALL_T) y = lagoonBed(x, z);
  const h = Math.max(headlandN(x, z), headlandS(x, z));
  return Math.max(y, h);
}

/* ================================================================== the volumes */

const rect = (minX, maxX, minZ, maxZ) => ({ minX, maxX, minZ, maxZ });
const r2 = n => Math.round(n * 100) / 100;

/** The z span of a room's door: across the middle of its east side. */
export function doorSpan(room) {
  const mid = (room.rect.minZ + room.rect.maxZ) / 2;
  return [r2(mid - DOOR.w / 2), r2(mid + DOOR.w / 2)];
}

function buildVolumes() {
  const vols = [];
  const open = (side, lo, hi, to, extra = {}) => ({ side, lo, hi, to, ...extra });
  const add = v => { vols.push(v); return v; };
  const roadX = [WALL.roadW, WALL.roadE];
  add({ id: 'yard-n', kind: 'yard', rect: rect(YARD_N.minX, YARD_N.maxX, YARD_N.minZ, YARD_N.maxZ), floor: { y0: CREST }, openings: [open('maxZ', ...roadX, 'road')] });
  const road = add({ id: 'road', kind: 'road', rect: rect(WALL.roadW, WALL.roadE, YARD_N.maxZ, YARD_S.minZ), floor: { y0: CREST }, openings: [open('minZ', ...roadX, 'yard-n'), open('maxZ', ...roadX, 'yard-s')] });
  add({ id: 'yard-s', kind: 'yard', rect: rect(YARD_S.minX, YARD_S.maxX, YARD_S.minZ, YARD_S.maxZ), floor: { y0: CREST }, openings: [open('minZ', ...roadX, 'road'), open('minZ', RAMP.minX, RAMP.maxX, 'ramp-1')] });
  add({
    id: 'ramp-1', kind: 'ramp', rect: rect(RAMP.minX, RAMP.maxX, RAMP.landS, RAMP.top),
    floor: { y0: GALLERY, y1: CREST, axis: 'z', from: RAMP.landS, to: RAMP.top },
    openings: [open('maxZ', RAMP.minX, RAMP.maxX, 'yard-s'), open('minZ', RAMP.minX, RAMP.maxX, 'landing')]
  });
  add({
    id: 'landing', kind: 'landing', rect: rect(RAMP.minX, RAMP.maxX, RAMP.landN, RAMP.landS), floor: { y0: GALLERY },
    openings: [open('maxZ', RAMP.minX, RAMP.maxX, 'ramp-1'), open('minZ', RAMP.minX, RAMP.maxX, 'ramp-2'), open('minX', ADIT.minZ, ADIT.maxZ, 'adit')]
  });
  add({
    id: 'ramp-2', kind: 'ramp', rect: rect(RAMP.minX, RAMP.maxX, RAMP.foot, RAMP.landN),
    floor: { y0: FOOT, y1: GALLERY, axis: 'z', from: RAMP.foot, to: RAMP.landN },
    openings: [open('maxZ', RAMP.minX, RAMP.maxX, 'landing'), open('minZ', RAMP.minX, RAMP.maxX, 'apron-w')]
  });
  add({ id: 'adit', kind: 'adit', rect: rect(ADIT.minX, ADIT.maxX, ADIT.minZ, ADIT.maxZ), floor: { y0: GALLERY }, roof: 3.6, openings: [open('maxX', ADIT.minZ, ADIT.maxZ, 'landing'), open('minX', ADIT.minZ, ADIT.maxZ, 'gallery')] });
  const gallery = add({ id: 'gallery', kind: 'gallery', rect: rect(GALLERY_RECT.minX, GALLERY_RECT.maxX, GALLERY_RECT.minZ, GALLERY_RECT.maxZ), floor: { y0: GALLERY }, roof: 4.4, openings: [open('maxX', ADIT.minZ, ADIT.maxZ, 'adit')] });
  const cage = ROOMS.find(r => r.shell === 'cage');
  const apronW = add({ id: 'apron-w', kind: 'apron', rect: rect(APRON.minX, cage.rect.maxX + cage.doorT, cage.rect.maxZ + WALL_T, APRON.maxZ), floor: { y0: FOOT }, openings: [open('maxZ', RAMP.minX, RAMP.maxX, 'ramp-2')] });
  const apron = add({ id: 'apron', kind: 'apron', rect: rect(cage.rect.maxX + cage.doorT, APRON.maxX, APRON.minZ, APRON.maxZ), floor: { y0: FOOT }, openings: [] });
  const apronNW = add({ id: 'apron-nw', kind: 'apron', rect: rect(APRON.minX, cage.rect.maxX + cage.doorT, APRON.minZ, cage.rect.minZ - WALL_T), floor: { y0: FOOT }, openings: [] });
  apronW.openings.push(open('maxX', apronW.rect.minZ, apronW.rect.maxZ, 'apron'));
  apron.openings.push(open('minX', apronW.rect.minZ, apronW.rect.maxZ, 'apron-w'));
  apronNW.openings.push(open('maxX', apronNW.rect.minZ, apronNW.rect.maxZ, 'apron'));
  apron.openings.push(open('minX', apronNW.rect.minZ, apronNW.rect.maxZ, 'apron-nw'));
  const outside = { road, gallery, apron };
  // The rooms and the passages into them: every door in the room's east side.
  for (const r of ROOMS) {
    const n = r.id.slice(5);
    const dz = doorSpan(r);
    const x0 = r.rect.maxX, x1 = r2(r.rect.maxX + r.doorT);
    vols.push({ id: `door-${n}`, kind: 'passage', rect: rect(x0, x1, dz[0], dz[1]), floor: { y0: r.floor }, roof: DOOR.top, openings: [open('minX', dz[0], dz[1], r.id), open('maxX', dz[0], dz[1], r.onto)] });
    vols.push({ id: r.id, kind: 'room', rect: rect(r.rect.minX, r.rect.maxX, r.rect.minZ, r.rect.maxZ), floor: { y0: r.floor }, roof: r.top, openings: [open('maxX', dz[0], dz[1], `door-${n}`)], room: r });
    outside[r.onto].openings.push(open('minX', dz[0], dz[1], `door-${n}`));
  }
  return vols;
}

const OPEN_KINDS = ['yard', 'road', 'ramp', 'landing', 'apron'];

/**
 * The plan. Everything is derived from the tables above.
 */
export function makeBarragePlan() {
  const work = makeWorkings(buildVolumes(), { openKinds: OPEN_KINDS, roof: 4.4, wallInner: 0.3, wallDepth: 0.6, jamb: 0.5, outdoorDoors: true });
  const { volumes, byId } = work;
  const openVols = volumes.filter(v => OPEN_KINDS.includes(v.kind));
  const roofed = volumes.filter(v => !OPEN_KINDS.includes(v.kind));
  const rooms = ROOMS.map(r => ({ ...r, vol: byId.get(r.id), door: byId.get(`door-${r.id.slice(5)}`), level: r.floor }));
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
    if (e) return floorOf(e, Math.min(e.rect.maxX, Math.max(e.rect.minX, x)), Math.min(e.rect.maxZ, Math.max(e.rect.minZ, z)));
    return land(x, z);
  }

  /** The roofed volume a point stands in (its cells are a hole in the ground mesh: the room builds its own floor). */
  function inRoofed(x, z) {
    for (const v of roofed) if (insideRect(v.rect, x, z)) return v;
    return null;
  }

  /** The walls of every volume, as `lib/workings.js` draws them, and their colliders. */
  const colliders = () => work.wallColliders();

  /** The lines the ground mesh must have a vertex row on, so each step is a sharp edge inside the body that hides it. */
  function breaks() {
    const xs = new Set(), zs = new Set();
    const both = (set, at) => { set.add(r2(at)); set.add(r2(at - 0.03)); set.add(r2(at + 0.03)); };
    for (const x of [WALL.west, WALL.roadW, WALL.roadE, WALL.deckW, WALL.east, YARD_N.minX - WALL_T, APRON.maxX + WALL_T]) both(xs, x);
    for (const z of [WALL.north, YARD_N.maxZ, YARD_S.minZ, YARD_S.maxZ, YARD_S.maxZ + WALL_T, APRON.maxZ, APRON.minZ - WALL_T]) both(zs, z);
    for (const v of volumes) {
      const r = v.rect;
      for (const x of [r.minX, r.maxX]) { xs.add(x); xs.add(r2(x - EDGE)); xs.add(r2(x + EDGE)); xs.add(r2(x - EDGE - 0.06)); xs.add(r2(x + EDGE + 0.06)); }
      for (const z of [r.minZ, r.maxZ]) { zs.add(z); zs.add(r2(z - EDGE)); zs.add(r2(z + EDGE)); zs.add(r2(z - EDGE - 0.06)); zs.add(r2(z + EDGE + 0.06)); }
    }
    return { xs: [...xs], zs: [...zs] };
  }

  /**
   * THE COVER: every room, passage, the adit and the gallery is roofed (the sun and most of the sky taken out). The low
   * sun comes into the two gate houses through a window in each one's south wall; nowhere else (every door faces east).
   */
  function coverSpec() {
    const boxes = [];
    for (const v of roofed) {
      const r = v.rect;
      const top = v.kind === 'room' ? (v.room.ridge ?? v.room.top) : (v.roof ?? 4.4);
      const sky = v.kind === 'room' ? v.room.sky : v.kind === 'gallery' || v.kind === 'adit' ? GALLERY_SKY : DOOR_SKY;
      const lo = v.floor.y0;
      boxes.push({ id: v.id, min: [r.minX - 0.05, lo - 0.3, r.minZ - 0.05], max: [r.maxX + 0.05, lo + top + 0.3, r.maxZ + 0.05], sky });
    }
    const openings = [];
    for (const r of rooms) {
      if (!r.window) continue;
      const v = r.vol.rect, lo = r.level;
      openings.push({
        id: `${r.id}-window`, axis: 'z', at: v.maxZ,
        lo: [r.window.x[0], lo + r.window.y[0]], hi: [r.window.x[1], lo + r.window.y[1]],
        reach: { min: [v.minX, lo - 0.3, v.minZ], max: [v.maxX, lo + (r.ridge ?? r.top) + 0.3, v.maxZ + 0.6] }
      });
    }
    return { boxes, openings };
  }

  /* ================================================================ the way */

  const volumeAt = (x, z) => work.volumeAt(x, z);

  /** How far into a volume the way stands off a doorway it comes in or goes out by. */
  const IN = 2.5;
  /** The side of a volume a point lies on (within 0.05 m), or null. */
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
      // The volume this leg crosses: the one its middle lies in.
      const v = volumeAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
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
        // Stand off a doorway square to it before turning, coming in and going out, so the way never grazes a jamb.
        const la = lead(a), lb = lead(b);
        if (la) out.push(la);
        if (lb && !(la && Math.hypot(la[0] - lb[0], la[1] - lb[1]) < 0.01)) out.push(lb);
      }
      out.push(b);
    }
    return out.filter((p, i) => i === 0 || Math.hypot(p[0] - out[i - 1][0], p[1] - out[i - 1][1]) > 0.01);
  }

  /** The plan's own consistency: every room big enough and under the deck, every door on its walk, the walk in the square. */
  function problems() {
    const out = [];
    for (const r of rooms) {
      const v = r.vol.rect;
      const across = v.maxZ - v.minZ, deep = v.maxX - v.minX;
      if (Math.min(across, deep) < 11 || Math.max(across, deep) < 11.2 || r.top < 4.4) out.push(`${r.id}: ${across} x ${deep} m with ${r.top} m over the floor, under 11.2 x 11 x 4.4`);
      const d = r.door.rect, o = byId.get(r.onto).rect;
      if (d.minZ < o.minZ + 1 || d.maxZ > o.maxZ - 1 || Math.abs(d.maxX - o.minX) > 1e-6) out.push(`${r.id}: its door does not open onto ${r.onto}`);
      if (r.level === GALLERY && r.level + r.top + ROOF_T > DECK - DECK_SLAB + 1e-6) out.push(`${r.id}: its roof (${r.top} + ${ROOF_T}) does not fit under the deck`);
      if (r.level === GALLERY && (v.minX < WALL.deckW + 1.5 || v.maxX > WALL.east - 1)) out.push(`${r.id}: it reaches out from under the deck`);
      if (r.level === CREST && v.maxX > WALL.west + 1e-6) out.push(`${r.id}: a gate house stands on the road`);
    }
    for (let i = 0; i < rooms.length; i++) for (let j = i + 1; j < rooms.length; j++) {
      const a = rooms[i].vol.rect, b = rooms[j].vol.rect;
      if (a.minX < b.maxX + 2 && b.minX < a.maxX + 2 && a.minZ < b.maxZ + 2 && b.minZ < a.maxZ + 2) out.push(`${rooms[i].id} and ${rooms[j].id} are less than 2 m apart`);
    }
    // Nothing is walked over anything else: the gallery, its chambers and the adit lie under the deck only.
    for (const v of volumes) {
      if (v.floor.y0 !== GALLERY || OPEN_KINDS.includes(v.kind)) continue;
      const r = v.rect;
      if (r.minX < WALL.deckW + 0.6 || r.maxX > WALL.east + 1e-6) out.push(`${v.id} reaches out from under the deck`);
    }
    for (let i = 0; i < volumes.length; i++) for (let j = i + 1; j < volumes.length; j++) {
      const a = volumes[i].rect, b = volumes[j].rect;
      if (a.minX < b.maxX - 1e-6 && b.minX < a.maxX - 1e-6 && a.minZ < b.maxZ - 1e-6 && b.minZ < a.maxZ - 1e-6) out.push(`${volumes[i].id} and ${volumes[j].id} overlap`);
    }
    for (const v of volumes) {
      const r = v.rect;
      if (Math.abs(r.minX) > WALK - 4 || Math.abs(r.maxX) > WALK - 4 || Math.abs(r.minZ) > WALK - 4 || Math.abs(r.maxZ) > WALK - 4) out.push(`${v.id} reaches outside the walk's square`);
    }
    return out;
  }

  const b = volumes.reduce((a, v) => ({ minX: Math.min(a.minX, v.rect.minX), maxX: Math.max(a.maxX, v.rect.maxX), minZ: Math.min(a.minZ, v.rect.minZ), maxZ: Math.max(a.maxZ, v.rect.maxZ) }), { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity });

  return {
    work, volumes, byId, rooms, roomById, roofed, openVols, bounds: b,
    height, land, inRoofed, colliders, breaks, coverSpec, routeTo, problems, volumeAt
  };
}
