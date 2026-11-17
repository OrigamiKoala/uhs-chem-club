/**
 * teeter/terrace-plan.js — Teeter's hillside of salt terraces, as plain data and plain functions.
 *
 * NO THREE.JS HERE. The layout generator, the world, the walk, the guide and `verify:teeter` all stand on this one
 * declaration, so what is walked is what is drawn and what is checked (`docs/plans/teeter-world.md` section 9).
 *
 * THE HILL faces west (downhill is -x). It is cut into TERRACES, level bands running north and south, each held up by
 * a masonry WALL 1 m thick whose downhill face stands at `FACE[k]`. Terrace k lies between the face of wall k+1 and
 * the face of wall k, at `LEVEL[k]`: a DIKE 6 m wide along the foot of the wall above it, then the PANS (0.35 m under
 * the terrace, brine on them) out to the top of the wall below. Terrace 0 is the top shelf (the spring, the pad);
 * terrace 4 is the drying floor; below it the terraces go on down to the valley as decor.
 *
 * THE WALK is a set of `lib/workings.js` volumes, closed on every side that is not a doorway:
 *   shelf     terrace 0's yard, where the Avalon sets down
 *   ramp-k    the stair: four ramps on one line at the south edge, each cut down through the terrace above and the
 *             wall, rising 5.5 m over 22 m
 *   dike-k    terrace k's walk along the foot of wall k, branching north off the stair's foot
 *   floor     terrace 4, the drying floor, where the Tipper is fought
 *   door-N    the passage through a terrace wall into a room (lintel 3.4 m)
 *   room-N    the room of bench N, dug into the terrace above under its pans (the roof is the pans' floor), or a weir
 *             house whose upper storey stands up among them (`house`)
 *
 * THE HEIGHT FIELD is ONE function: inside a volume its floor; within `EDGE` of an open volume's closed side the same
 * floor (the step to the land is hidden inside the wall or kerb that stands there); everywhere else the land, which is
 * the terraces (a dike strip at the terrace's level, pans under it), the hill east of the shelf, the valley floor west of
 * the decor terraces and the spurs that close the head of the valley north and south.
 */

import { makeWorkings, insideRect, floorOf } from '../lib/workings.js';

/** The walk stays in this square about the origin (the stage's bound for every Learn world). */
export const WALK = 100;

/** Walking level of each terrace, top shelf to drying floor, then the decor terraces and the valley floor. */
export const LEVEL = [22, 16.5, 11, 5.5, 0, -5.5, -11, -16.5, -22];
/** The downhill face of wall k (index k; wall k holds terrace k-1 up over terrace k). Index 0 is unused. */
export const FACE = [null, 40, 12, -16, -44, -66, -90, -114, -138];
/** The walls and the walk's own terraces. */
export const WALLS = [1, 2, 3, 4, 5, 6, 7, 8];
export const WALL_T = 1.0;
/** A dike's width, and the kerb between it and the pans. */
export const DIKE_W = 6;
export const KERB_T = 0.6;
/** How far under its terrace a pan's floor lies, and where its brine stands. */
export const PAN = { floor: -0.35, water: -0.2 };
/** How far an open volume's floor runs into the wall or kerb that closes it (the step is hidden there). */
export const EDGE = 0.3;
/** The stair's line: every ramp runs between these z. */
export const STAIR = { z0: 34, z1: 38.4 };
/** A ramp's length (m) for its 5.5 m of rise: 1 in 4. */
export const RAMP_L = 22;
/** How far north and south the terraces and their walls run before the spurs rise over them. */
export const TERRACE_Z = 128;
/** The shelf, and the drying floor. */
export const SHELF = { minX: 62, maxX: 95, minZ: -24, maxZ: 44 };
export const FLOOR4 = { minX: -65, maxX: -44, minZ: -34, maxZ: 40 };
/** Where the dikes of terraces 1 to 3 end at the north (they all end at z 40 at the south, past the stair). */
const DIKE_N = { 1: -10, 2: -22, 3: -10 };

export const SPAWN = [70, LEVEL[0] + 1.6, 30];
export const SPAWN_LOOK = [58, LEVEL[0] + 1.2, 36.2];
export const PAD = [80, 10];
/** The Tipper's ground at the north end of the drying floor, the great pan below the parapet to its west. */
export const ARENA = { boss: [-55, 0, -24], player: [-55, 1.6, -8] };

/** The passage through a wall: its width, and the lintel over it. */
export const DOOR = { w: 3.6, top: 3.4 };
/** How far in front of the back wall the plate stands. */
export const PLATE_FROM_BACK = 3.0;

/**
 * THE ROOMS, one per bench, in bench order. `wall` is the wall the room is dug in behind (its floor is the terrace below
 * that wall); `z` is its span across (north to south), `depth` how far it runs in behind the wall's inner face.
 * `shell` is how `terrain.js` builds its roof:
 *   vaultX   a barrel vault running east and west          vaultZ   a barrel vault running north and south
 *   steel    a flat roof on rolled steel beams               joists   timber joists on two timber girders
 *   jack     brick jack arches between steel beams           shaft    a slab roof with a square shaft open to the sky
 *   gable    a weir house: walls up through the pans, a gabled timber roof
 *   mono     a weir house: walls up through the pans, a monopitch roof rising to the back
 * `top` is the clear height over the floor at the plate (the crown of a vault, the underside of a flat roof, the eaves
 * of a house); `ridge` the highest a house's roof reaches; `sky` how much of the sky's fill the cover mask leaves.
 */
export const ROOMS = [
  { id: 'room-1', site: 'site-1', wall: 1, z: [17.4, 30.4], depth: 12.4, shell: 'vaultX', top: 4.7, sky: 0.3 },
  { id: 'room-2', site: 'site-2', wall: 1, z: [-6, 8], depth: 11.4, shell: 'gable', top: 6.4, ridge: 8.4, sky: 0.34 },
  { id: 'room-3', site: 'site-3', wall: 2, z: [10.6, 22.2], depth: 13.0, shell: 'steel', top: 4.6, sky: 0.3 },
  { id: 'room-4', site: 'site-4', wall: 2, z: [-18, -5], depth: 12.0, shell: 'joists', top: 4.5, sky: 0.3 },
  { id: 'room-5', site: 'site-5', wall: 3, z: [18, 30.4], depth: 11.4, shell: 'mono', top: 6.0, ridge: 7.4, sky: 0.34 },
  { id: 'room-6', site: 'site-6', wall: 3, z: [-6, 9], depth: 13.6, shell: 'shaft', top: 4.6, sky: 0.3, shaft: { back: 1.0, size: 2.4, side: 4.6 } },
  { id: 'room-7', site: 'site-7', wall: 4, z: [5, 18.6], depth: 12.2, shell: 'vaultZ', top: 4.7, sky: 0.3 },
  { id: 'room-8', site: 'site-8', wall: 4, z: [-20, -7.2], depth: 11.8, shell: 'jack', top: 4.5, sky: 0.3 }
];

/** The roof's thickness over a room under the pans: its top is the pans' floor. */
export const ROOF_T = 0.4;
/** How much of the sky the passage and the open parts of the walk keep. */
const DOOR_SKY = 0.45;

const smooth = (a, b, t) => { const x = Math.max(0, Math.min(1, (t - a) / (b - a))); return x * x * (3 - 2 * x); };
const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
function vnoise(x, z) {
  const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j;
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, z, n = 4) {
  let s = 0, a = 0.5;
  for (let i = 0; i < n; i++) { s += a * vnoise(x, z); x = x * 2.03 + 7.1; z = z * 2.03 - 3.3; a *= 0.5; }
  return s;
}

/** The terrace (band) index at x: 0 is the top shelf; a band runs from the middle of the wall below it to the middle of the wall above. */
export function bandAt(x) {
  let k = 0;
  for (const w of WALLS) if (x < FACE[w] + WALL_T / 2) k = w;
  return k;
}

/** Where the dike strip of terrace k begins on its west side (the kerb's middle), or for the shelf and the floor, the whole band. */
export function dikeStart(k) {
  if (k === 0) return SHELF.minX - EDGE;
  if (k === 4) return -Infinity;
  return FACE[k] - DIKE_W - EDGE;
}

/** The pans' zone of terrace k across the slope: from the inner face of the wall below to the kerb (null for the floor). */
export function panZone(k) {
  if (k === 4 || k >= LEVEL.length - 1) return null;
  const lo = FACE[k + 1] + WALL_T;
  const hi = k === 0 ? SHELF.minX - KERB_T : FACE[k] - DIKE_W - KERB_T;
  return { minX: lo, maxX: hi };
}

/** The hill rising east of the shelf to the ridge. */
function hill(x, z) {
  const d = x - (SHELF.maxX + EDGE);
  if (d <= 0) return 0;
  const rise = Math.min(d, 6) * 1.1 + Math.max(0, d - 6) * 0.42 * (1 - smooth(140, 420, d) * 0.6);
  return rise + fbm(x * 0.02, z * 0.02) * smooth(0, 30, d) * 18 - smooth(-20, 40, d) * Math.exp(-((z - 10) * (z - 10)) / 600) * 6;
}

/** The terraced land with no spur: the band's dike strip at its level, its pans under it; the hill; the valley. */
function terraced(x, z) {
  if (x > SHELF.maxX + EDGE) return LEVEL[0] + hill(x, z);
  const k = bandAt(x);
  if (k >= LEVEL.length - 1) {
    // The valley floor, with its river channel and, far off, the opposite range.
    const far = -x - 420;
    const river = Math.exp(-Math.pow((x + 230 + Math.sin(z * 0.012) * 40) / 9, 2)) * 1.6;
    return LEVEL[LEVEL.length - 1] - river + (far > 0 ? far * 0.18 * smooth(0, 200, far) + fbm(x * 0.006, z * 0.006) * 60 * smooth(0, 300, far) : fbm(x * 0.03, z * 0.03) * 0.4);
  }
  const L = LEVEL[k];
  return x >= dikeStart(k) ? L : L + PAN.floor;
}

/** The land outside the walk: the terraces, closed north and south by the spurs, which rise over the terrace field's ends. */
export function land(x, z) {
  const t = terraced(x, z);
  const az = Math.abs(z);
  if (az <= TERRACE_Z) return t;
  // Past the terraces' ends the hillside runs smooth (the steps fade within 12 m), and the spur rises over it.
  const smoothHill = x > SHELF.maxX ? t : LEVEL[0] + (x - SHELF.maxX) * (LEVEL[0] - LEVEL[LEVEL.length - 1]) / (SHELF.maxX - FACE[FACE.length - 1]);
  const slope = x < FACE[FACE.length - 1] ? t : smoothHill;
  const fade = smooth(TERRACE_Z, TERRACE_Z + 12, az);
  const spur = smooth(TERRACE_Z, TERRACE_Z + 70, az) * (38 + fbm(x * 0.015, z * 0.015) * 30) * (1 - smooth(-300, -500, x) * 0.5);
  return t + (Math.max(t, slope) - t) * fade + spur;
}

/** A room's shaft (x, z of its middle, its size; `side` sets it to the south of the plate, clear of the bay), and the pier round its mouth on the terrace above. */
export function shaftOf(r) {
  const minX = FACE[r.wall] + WALL_T, maxX = minX + r.depth;
  const cx = maxX - r.shaft.back - r.shaft.size / 2, cz = (r.z[0] + r.z[1]) / 2 + (r.shaft.side || 0);
  return { cx, cz, size: r.shaft.size };
}
export function shaftPier(r) {
  const s = shaftOf(r), h = s.size / 2 + 4.6;
  return { minX: s.cx - h, maxX: s.cx + h, minZ: s.cz - h, maxZ: s.cz + h };
}

/**
 * The beam pumps that stand in the pans away from the walk, each on its own pier (`terrace` is the terrace it stands on):
 * they lift brine from the main up into the top pan of each run. The fourth pump stands over room 6's shaft.
 */
export const PUMP_PIERS = [
  { id: 'pump-a', terrace: 0, x: 51, z: -80 },
  { id: 'pump-b', terrace: 1, x: 23, z: -66 },
  { id: 'pump-c', terrace: 3, x: -33, z: -58 }
];
/** A pump pier's footprint among the pans. */
export const pumpPier = p => ({ minX: p.x - 2.0, maxX: p.x + 5.6, minZ: p.z - 1.6, maxZ: p.z + 1.6 });

/* ================================================================== the volumes */

const rect = (minX, maxX, minZ, maxZ) => ({ minX, maxX, minZ, maxZ });
const r2 = n => Math.round(n * 100) / 100;

function buildVolumes() {
  const vols = [];
  const open = (side, lo, hi, to, extra = {}) => ({ side, lo, hi, to, ...extra });
  // The shelf.
  vols.push({ id: 'shelf', kind: 'dike', rect: rect(SHELF.minX, SHELF.maxX, SHELF.minZ, SHELF.maxZ), floor: { y0: LEVEL[0] }, openings: [open('minX', STAIR.z0, STAIR.z1, 'ramp-1')] });
  // The stair and the dikes.
  for (const k of [1, 2, 3, 4]) {
    const F = FACE[k];
    const below = k === 4 ? 'floor' : `dike-${k}`;
    const above = k === 1 ? 'shelf' : `dike-${k - 1}`;
    vols.push({
      id: `ramp-${k}`, kind: 'ramp', rect: rect(F, F + RAMP_L, STAIR.z0, STAIR.z1),
      floor: { y0: LEVEL[k], y1: LEVEL[k - 1], axis: 'x', from: F, to: F + RAMP_L },
      openings: [open('minX', STAIR.z0, STAIR.z1, below), open('maxX', STAIR.z0, STAIR.z1, above)]
    });
  }
  for (const k of [1, 2, 3]) {
    const F = FACE[k];
    const opens = [open('maxX', STAIR.z0, STAIR.z1, `ramp-${k}`), open('minX', STAIR.z0, STAIR.z1, `ramp-${k + 1}`)];
    vols.push({ id: `dike-${k}`, kind: 'dike', rect: rect(F - DIKE_W, F, DIKE_N[k], 40), floor: { y0: LEVEL[k] }, openings: opens });
  }
  vols.push({ id: 'floor', kind: 'dike', rect: rect(FLOOR4.minX, FLOOR4.maxX, FLOOR4.minZ, FLOOR4.maxZ), floor: { y0: LEVEL[4] }, openings: [open('maxX', STAIR.z0, STAIR.z1, 'ramp-4')] });
  // The rooms and the passages into them.
  for (const r of ROOMS) {
    const F = FACE[r.wall], k = r.wall, mid = (r.z[0] + r.z[1]) / 2;
    const dz = [r2(mid - DOOR.w / 2), r2(mid + DOOR.w / 2)];
    const outside = k === 4 ? 'floor' : `dike-${k}`;
    const n = r.id.slice(5);
    vols.push({ id: `door-${n}`, kind: 'passage', rect: rect(F, F + WALL_T, dz[0], dz[1]), floor: { y0: LEVEL[k] }, roof: DOOR.top, openings: [open('minX', dz[0], dz[1], outside), open('maxX', dz[0], dz[1], r.id)] });
    vols.push({ id: r.id, kind: 'room', rect: rect(F + WALL_T, F + WALL_T + r.depth, r.z[0], r.z[1]), floor: { y0: LEVEL[k] }, roof: r.top, openings: [open('minX', dz[0], dz[1], `door-${n}`)], room: r });
    const host = vols.find(v => v.id === outside);
    host.openings.push(open('maxX', dz[0], dz[1], `door-${n}`));
  }
  return vols;
}

/**
 * The plan. Everything is derived from the tables above.
 */
export function makeTerracePlan() {
  const work = makeWorkings(buildVolumes(), { openKinds: ['dike', 'ramp'], roof: 4.4, wallInner: 0.3, wallDepth: 0.6, jamb: 0.5 });
  const { volumes, byId } = work;
  const openVols = volumes.filter(v => v.kind === 'dike' || v.kind === 'ramp');
  const roofed = volumes.filter(v => v.kind === 'room' || v.kind === 'passage');
  const rooms = ROOMS.map(r => ({ ...r, vol: byId.get(r.id), door: byId.get(`door-${r.id.slice(5)}`), level: LEVEL[r.wall], face: FACE[r.wall] }));
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

  /** What the ground mesh is drawn at: the height field, except that a roofed volume is a hole in it (its own floor is built). */
  function inRoofed(x, z) {
    for (const v of roofed) if (insideRect(v.rect, x, z)) return v;
    return null;
  }

  /** The walls of every volume, as `lib/workings.js` draws them, and their colliders. */
  const colliders = () => work.wallColliders();

  /** The lines the ground mesh must have a vertex row on, so each step is a sharp edge inside the body that hides it. */
  function breaks() {
    const xs = new Set(), zs = new Set();
    const pair = (set, at) => { set.add(r2(at - 0.03)); set.add(r2(at + 0.03)); };
    for (const w of WALLS) pair(xs, FACE[w] + WALL_T / 2);
    for (const k of [1, 2, 3, 5, 6, 7]) pair(xs, FACE[k] - DIKE_W - EDGE);
    pair(xs, SHELF.minX - EDGE);
    for (const v of volumes) {
      const r = v.rect;
      for (const x of [r.minX, r.maxX]) { xs.add(x); xs.add(r2(x - EDGE)); xs.add(r2(x + EDGE)); xs.add(r2(x - EDGE - 0.06)); xs.add(r2(x + EDGE + 0.06)); }
      for (const z of [r.minZ, r.maxZ]) { zs.add(z); zs.add(r2(z - EDGE)); zs.add(r2(z + EDGE)); zs.add(r2(z - EDGE - 0.06)); zs.add(r2(z + EDGE + 0.06)); }
    }
    return { xs: [...xs], zs: [...zs] };
  }

  /**
   * THE PANS: the rectangles of brine on every terrace, between the dike strip and the wall below, cut round the stair, the
   * weir houses and the pump over room 6. Each is `{ id, terrace, minX, maxX, minZ, maxZ, level }` (`level` the terrace's).
   */
  function pans() {
    const out = [];
    const cut = [];
    for (const k of [1, 2, 3, 4]) cut.push(rect(FACE[k] - 0.6, FACE[k] + RAMP_L + 0.6, STAIR.z0 - 0.6, STAIR.z1 + 0.6));
    for (const r of rooms) if (r.shell === 'gable' || r.shell === 'mono') {
      const v = r.vol.rect;
      cut.push(rect(v.minX - 0.6, v.maxX + 0.6, v.minZ - 0.6, v.maxZ + 0.6));
    }
    // The pump over room 6 stands on a pier among the pans, round the shaft's mouth.
    for (const r of rooms) if (r.shaft) cut.push(shaftPier(r));
    for (const p of PUMP_PIERS) cut.push(pumpPier(p));
    const hits = (a) => cut.some(c => a.minX < c.maxX && a.maxX > c.minX && a.minZ < c.maxZ && a.maxZ > c.minZ);
    const DIK = 0.6;
    for (let k = 0; k < LEVEL.length - 1; k++) {
      const zone = panZone(k);
      if (!zone) continue;
      const width = zone.maxX - zone.minX;
      const rows = Math.max(1, Math.round(width / 10.5));
      const rowW = width / rows;
      const pitch = 9 + (k % 3) * 0.8;
      const z0 = -TERRACE_Z + (k % 2) * pitch / 2;
      for (let i = 0; i < rows; i++) {
        const x0 = zone.minX + i * rowW, x1 = x0 + rowW;
        for (let z = z0; z < TERRACE_Z - 2; z += pitch) {
          const p = { minX: r2(x0 + (i ? DIK / 2 : 0)), maxX: r2(x1 - (i < rows - 1 ? DIK / 2 : 0)), minZ: r2(z + DIK / 2), maxZ: r2(Math.min(z + pitch, TERRACE_Z) - DIK / 2) };
          if (p.maxZ - p.minZ < 3) continue;
          if (hits(p)) {
            // Split round what it meets, along z only: keep the parts clear of every cut that are big enough to hold brine.
            const spans = [[p.minZ, p.maxZ]];
            for (const c of cut) {
              if (!(p.minX < c.maxX && p.maxX > c.minX)) continue;
              for (let s = spans.length - 1; s >= 0; s--) {
                const [a, b] = spans[s];
                if (b <= c.minZ || a >= c.maxZ) continue;
                spans.splice(s, 1);
                if (c.minZ - a >= 3) spans.push([a, r2(c.minZ - DIK / 2)]);
                if (b - c.maxZ >= 3) spans.push([r2(c.maxZ + DIK / 2), b]);
              }
            }
            for (const [a, b] of spans) out.push({ ...p, minZ: a, maxZ: b, terrace: k, level: LEVEL[k], id: `pan-${k}-${out.length}` });
            continue;
          }
          out.push({ ...p, terrace: k, level: LEVEL[k], id: `pan-${k}-${out.length}` });
        }
      }
    }
    return out;
  }

  /** The pan a point stands over, or null. */
  let panCache = null;
  const panList = () => (panCache ||= pans());

  /**
   * THE COVER: every room and every passage is roofed (the sun and 0.7 of the sky taken out). The sun still reaches the first
   * metres inside each doorway (a real hole); room 6's shaft lets in sky, not sun (the sun stands 14 degrees up).
   */
  function coverSpec() {
    const boxes = [];
    for (const v of roofed) {
      const r = v.rect;
      const top = v.kind === 'room' ? v.room.ridge ?? v.room.top : DOOR.top;
      const sky = v.kind === 'room' ? v.room.sky : DOOR_SKY;
      const lo = v.floor.y0;
      boxes.push({ id: v.id, min: [r.minX - 0.05, lo - 0.3, r.minZ - 0.05], max: [r.maxX + 0.05, lo + top + 0.3, r.maxZ + 0.05], sky });
    }
    const openings = [];
    for (const r of rooms) {
      const v = r.vol.rect, d = r.door.rect, lo = r.level;
      openings.push({ id: `${r.id}-door`, axis: 'x', at: d.minX, lo: [lo, d.minZ], hi: [lo + DOOR.top, d.maxZ], reach: { min: [d.minX - 0.5, lo - 0.3, v.minZ], max: [v.minX + 2.5, lo + DOOR.top + 0.5, v.maxZ] } });
    }
    return { boxes, openings };
  }

  /* ================================================================ the way */

  /** Which part of the walk (x, z) is in. */
  const volumeAt = (x, z) => work.volumeAt(x, z);

  /** The dike (or the floor) a room opens onto, and the shelf or dike a ramp's head lies on. */
  const dikeOf = k => byId.get(k === 0 ? 'shelf' : k === 4 ? 'floor' : `dike-${k}`);
  const stairMid = (STAIR.z0 + STAIR.z1) / 2;
  /** The middle of a dike's width (the line the guide walks), or for the shelf and the floor, a line 3 m out from the wall. */
  const lineOf = k => k === 0 ? SHELF.minX + 3 : FACE[k] - 3;
  /** The terrace a point is on (by the volume it is in). */
  function terraceOf(x, z) {
    const v = volumeAt(x, z);
    if (!v) return bandAt(x);
    if (v.id === 'shelf') return 0;
    if (v.id === 'floor') return 4;
    if (v.kind === 'ramp') return Number(v.id.slice(5));
    if (v.kind === 'dike') return Number(v.id.slice(5));
    if (v.kind === 'passage' || v.kind === 'room') return roomById.get(`room-${v.id.split('-')[1]}`).wall;
    return bandAt(x);
  }

  /**
   * The way on foot from (fx, fz) to (tx, tz), as [x, z] points: out of a room by its door, along the dike's middle to
   * the stair, down (or up) the stair along its middle, along the next dike, in at the door. The guide arrow follows it.
   */
  function routeTo(fx, fz, tx, tz) {
    const pts = [[fx, fz]];
    const from = volumeAt(fx, fz), to = volumeAt(tx, tz);
    if (from && to && from === to) { pts.push([tx, tz]); return pts; }
    // Leave a room or a passage by its door, onto the dike's line.
    const leave = (v) => {
      if (v && (v.kind === 'room' || v.kind === 'passage')) {
        const n = v.id.split('-')[1], d = byId.get(`door-${n}`).rect, mz = (d.minZ + d.maxZ) / 2;
        const k = roomById.get(`room-${n}`).wall;
        return [[d.maxX + 0.5, mz], [d.minX - 0.6, mz], [lineOf(k), mz]];
      }
      return [];
    };
    const out = leave(from);
    for (const p of out) pts.push(p);
    let k = from ? terraceOf(fx, fz) : bandAt(fx);
    const target = to ? terraceOf(tx, tz) : bandAt(tx);
    const cur = () => pts[pts.length - 1];
    if (k !== target) {
      // Along this terrace's line to the stair, then ramp by ramp.
      if (!(from && from.kind === 'ramp')) pts.push([lineOf(k), cur()[1]]);
      const step = target > k ? 1 : -1;
      if (from?.kind === 'ramp') {
        // On a ramp already: finish it in the way of travel.
        const rk = Number(from.id.slice(5));
        pts.push([target > k || (target >= rk) ? FACE[rk] - 0.5 : FACE[rk] + RAMP_L + 0.5, stairMid]);
        k = target >= rk ? rk : rk - 1;
        if (k !== target) pts.push([lineOf(k), stairMid]);
      } else {
        pts.push([lineOf(k), stairMid]);
      }
      while (k !== target) {
        const rk = step > 0 ? k + 1 : k;         // the ramp between terrace k and k+step
        const F = FACE[rk];
        if (step > 0) { pts.push([F + RAMP_L + 0.5, stairMid]); pts.push([F - 0.5, stairMid]); }
        else { pts.push([F - 0.5, stairMid]); pts.push([F + RAMP_L + 0.5, stairMid]); }
        k += step;
        pts.push([lineOf(k), stairMid]);
      }
    }
    if (to && (to.kind === 'room' || to.kind === 'passage')) {
      const n = to.id.split('-')[1], d = byId.get(`door-${n}`).rect, mz = (d.minZ + d.maxZ) / 2;
      pts.push([lineOf(target), cur()[1]]);
      pts.push([lineOf(target), mz]);
      pts.push([d.minX - 0.6, mz]);
      pts.push([d.maxX + 0.5, mz]);
    } else if (k === target && pts.length > 1) {
      pts.push([lineOf(target), tz]);
    }
    pts.push([tx, tz]);
    // Drop repeated points.
    return pts.filter((p, i) => i === 0 || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) > 0.01);
  }

  /** The plan's own consistency: every door on its dike's level floor, every room big enough, the walk inside the square. */
  function problems() {
    const out = [];
    for (const r of rooms) {
      const v = r.vol.rect;
      const across = v.maxZ - v.minZ, deep = v.maxX - v.minX;
      if (across < 11.2 || deep < 11 || r.top < 4.4) out.push(`${r.id}: ${across} x ${deep} m with ${r.top} m over the floor, under 11.2 x 11 x 4.4`);
      const outside = dikeOf(r.wall).rect;
      const d = r.door.rect;
      if (d.minZ < outside.minZ + 1 || d.maxZ > outside.maxZ - 1) out.push(`${r.id}: its door is not on its dike`);
      if (v.maxZ > STAIR.z0 - 1.5 && v.minZ < STAIR.z1 + 1.5 && r.wall < 5) out.push(`${r.id}: it meets the stair`);
      if (r.shell !== 'gable' && r.shell !== 'mono' && r.top + ROOF_T > LEVEL[r.wall - 1] + PAN.floor - LEVEL[r.wall] + 1e-6) out.push(`${r.id}: its roof (${r.top} + ${ROOF_T}) does not fit under the pans above`);
      const zone = panZone(r.wall - 1);
      if (v.maxX + 0.6 > zone.maxX) out.push(`${r.id}: it reaches past the pans above into the dike`);
    }
    for (let i = 0; i < rooms.length; i++) for (let j = i + 1; j < rooms.length; j++) {
      const a = rooms[i].vol.rect, b = rooms[j].vol.rect;
      if (rooms[i].wall === rooms[j].wall && a.minZ < b.maxZ + 2 && b.minZ < a.maxZ + 2) out.push(`${rooms[i].id} and ${rooms[j].id} are less than 2 m apart`);
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
    height, land, inRoofed, colliders, breaks, pans: panList, coverSpec, routeTo, problems, volumeAt, terraceOf, lineOf, dikeOf
  };
}
