/**
 * lanternfall/stations.js — The ten hosts: the rooms round the lake and in the glacier where Lanternfall's benches are.
 *
 * A host is the room AND the working machinery of that place AND the bench, built as ONE object, so the overlap rule
 * (which exempts a body's own parts) lets the bench stand inside its room and against its machinery. The room's walls,
 * floor and roof are the SHELL (`phys: 'ground'`, merged per material): ice, moraine, rock, slabs, timber and steel as
 * the place is made of. The machinery and the bench are ordinary bodies the world bakes.
 *
 * THE HOST FRAME. Origin on the floor under the middle of the plate; +z is the front (toward the approach mark), +x to
 * the player's right. The world places the group at `site.pos`, turned to face `site.approachPos`. The room's interior
 * in this frame is `F.x0..F.x1`, `F.z0..F.z1` (`glacier-plan.js` ROOMS, turned); the door is on one side of it. Every
 * builder keeps the bay (`bench-bay.js`) empty by construction:
 *
 *   |x| < 2.75, z in [-1.95, 0.65]   nothing from the floor up to 2.4 m (plate, instrument, screens)
 *   |x| < 2.4,  z in [0.65, 5.05]    nothing from 0.3 to 2.2 m (the player and the camera)
 *   |x| < 1.2,  z in [0.65, 2.75]    nothing from 2.2 to 4.6 m (the lean-in camera)
 *
 * so machinery stands to the sides (|x| >= 3), behind the plate (z <= -2.1) or overhead out of the lean-in box.
 * ONLY LAMPS ARE LIT: each host hangs pooled lamp marks (`lamp-pool.js`) with an amber fixture; no PointLight.
 *
 * @returns {{ group, bench, benchLocal, colliders, shell }} colliders host-local: `{ lx, lz, r }` and `{ lx, lz, hw, hd }`.
 */

import * as THREE from 'three';
import { buildBayBench, ctxMats } from '../bench-bay.js';
import { HOST_PLAN } from './host-plan.js';
import { ROOMS, DOME, WALL_T, sitePlacement, doorRect, fbm2, ridge2, smooth } from './glacier-plan.js';
import { Buckets, rng } from './kit.js';

const LANTERN = 0xd99423;
const UP = new THREE.Vector3(0, 1, 0);
const PLATE = { lx: 0, lz: 0, hw: 2.45, hd: 0.68 };
const DOOR_TOP = 3.6;

/* ======================================================================
   THE BENCH — the shared bay bench, its cased instrument dressed for the kind
   ====================================================================== */

export function buildLfBench(ctx, { kind = 'light', plate = 'BN-01', skin = 'shelf' } = {}) {
  const M = ctx.M;
  const mesh = (geo, mat, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(ctx.own(geo), mat);
    m.position.set(x, y, z);
    return m;
  };
  return buildBayBench(ctx, {
    skin,
    plate,
    mats: ctxMats(ctx),
    tagStyle: { fg: '#1d2a33', bg: '#cfe0e8' },
    dormant(dormant, { height }) {
      const housing = mesh(new THREE.BoxGeometry(1.15, 0.78, 0.52), kind === 'rack' ? M.caseDark : M.case, 0, height + 0.43, -0.16);
      housing.castShadow = housing.receiveShadow = ctx.t4;
      dormant.add(housing);
      if (kind === 'light') {
        const lamp = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 20), M.caseDark, -0.28, height + 0.5, 0.14);
        lamp.rotation.x = Math.PI / 2;
        dormant.add(lamp);
        dormant.add(mesh(new THREE.CircleGeometry(0.135, 20), M.glassDark, -0.28, height + 0.5, 0.205));
        dormant.add(mesh(new THREE.BoxGeometry(0.34, 0.03, 0.02), M.caseDark, 0.22, height + 0.5, 0.11));
        dormant.add(mesh(new THREE.BoxGeometry(0.34, 0.03, 0.02), M.caseDark, 0.22, height + 0.38, 0.11));
      } else if (kind === 'cloud') {
        dormant.add(mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.05, 8), M.caseDark, 0, height + 0.5, 0.12));
        dormant.add(mesh(new THREE.BoxGeometry(0.36, 0.36, 0.36), M.glass, 0, height + 0.72, 0.12));
      } else if (kind === 'rack') {
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 5 - (r % 2); c++) {
            dormant.add(mesh(new THREE.BoxGeometry(0.1, 0.1, 0.012), M.glassDark, -0.38 + c * 0.17 + (r % 2) * 0.085, height + 0.28 + r * 0.16, 0.1));
          }
        }
      } else {
        for (const [rad, rot] of [[0.12, 0], [0.2, 0.7], [0.28, 1.4]]) {
          const ring = mesh(new THREE.TorusGeometry(rad, 0.012, 6, 28), M.caseDark, 0, height + 0.52, 0.12);
          ring.rotation.set(Math.PI / 2 + rot * 0.15, 0, rot);
          dormant.add(ring);
        }
        dormant.add(mesh(new THREE.SphereGeometry(0.035, 10, 8), M.case, 0, height + 0.52, 0.12));
      }
    }
  });
}

/* ======================================================================
   THE HOST FRAME
   ====================================================================== */

/** A room turned into its host's frame: interior rect, door, shared wall, and the two transforms. */
export function frameOf(rm) {
  const place = sitePlacement(rm);
  const [px, , pz] = place.pos;
  const [fx, fz] = place.facing;
  const rot = Math.atan2(fx, fz);
  const c = Math.cos(rot), s = Math.sin(rot);
  const toHost = (wx, wz) => [(wx - px) * c - (wz - pz) * s, (wx - px) * s + (wz - pz) * c];
  const toWorld = (lx, lz) => [px + lx * c + lz * s, pz - lx * s + lz * c];
  const box = r => {
    const pts = [[r.minX, r.minZ], [r.maxX, r.minZ], [r.minX, r.maxZ], [r.maxX, r.maxZ]].map(p => toHost(...p));
    const xs = pts.map(p => p[0]), zs = pts.map(p => p[1]);
    const rd = v => Math.round(v * 1000) / 1000;
    return { x0: rd(Math.min(...xs)), x1: rd(Math.max(...xs)), z0: rd(Math.min(...zs)), z1: rd(Math.max(...zs)) };
  };
  const sideOf = worldSide => {
    const n = { minX: [-1, 0], maxX: [1, 0], minZ: [0, -1], maxZ: [0, 1] }[worldSide];
    const hx = n[0] * c - n[1] * s, hz = n[0] * s + n[1] * c;
    if (hx > 0.5) return 'right';
    if (hx < -0.5) return 'left';
    return hz > 0 ? 'front' : 'back';
  };
  const R = box(rm.rect);
  const D = box(doorRect(rm));
  const doorSide = sideOf(rm.door.side);
  const along = doorSide === 'front' || doorSide === 'back' ? [D.x0, D.x1] : [D.z0, D.z1];
  const F = {
    ...R, T: rm.top, rot, toHost, toWorld, floor: rm.floor, room: rm,
    door: { side: doorSide, lo: along[0], hi: along[1], depth: rm.porch ?? WALL_T, top: DOOR_TOP, rect: D },
    shared: rm.sharedWall ? sideOf(rm.sharedWall) : null,
    extra: []
  };
  // Room 5 also carries the door into room 6 in its west wall.
  if (rm.id === 'room-5') {
    const r6 = ROOMS.find(r => r.id === 'room-6');
    const D6 = box(doorRect(r6));
    F.extra.push({ side: sideOf('minX'), lo: D6.z0, hi: D6.z1, depth: WALL_T, top: DOOR_TOP, rect: D6 });
  }
  return F;
}

/** One side of the interior rect: its two ends (left to right as seen from inside), its inward normal, its length. */
function sideLine(F, side) {
  if (side === 'back') return { a: [F.x0, F.z0], b: [F.x1, F.z0], n: [0, 1] };
  if (side === 'front') return { a: [F.x1, F.z1], b: [F.x0, F.z1], n: [0, -1] };
  if (side === 'left') return { a: [F.x0, F.z1], b: [F.x0, F.z0], n: [1, 0] };
  return { a: [F.x1, F.z0], b: [F.x1, F.z1], n: [-1, 0] };
}
const SIDES = ['back', 'front', 'left', 'right'];

/** The doors on one side (the room's own and any extra), as spans along that side's host axis. */
const doorsOn = (F, side) => [F.door, ...F.extra].filter(d => d.side === side);
const alongOf = (side, x, z) => (side === 'back' || side === 'front') ? x : z;
const inDoor = (F, side, x, z, y, pad = 0.05) =>
  doorsOn(F, side).some(d => { const a = alongOf(side, x, z); return a > d.lo - pad && a < d.hi + pad && y < d.top + pad; });

/**
 * The stretches of one side (as distances `s` from its first end, running `-ext` to `len + ext` so the corners are
 * filled) that are wall at height `y`: everything but the doors whose opening reaches that high.
 */
function spans(F, side, y, ext = WALL_T) {
  const { a, b: e } = sideLine(F, side);
  const len = Math.hypot(e[0] - a[0], e[1] - a[1]);
  const pos = ((e[0] - a[0]) + (e[1] - a[1])) > 0;
  const a0 = alongOf(side, a[0], a[1]);
  let out = [[-ext, len + ext]];
  for (const d of doorsOn(F, side)) {
    if (y >= d.top) continue;
    const [g0, g1] = pos ? [d.lo - a0, d.hi - a0] : [a0 - d.hi, a0 - d.lo];
    out = out.flatMap(([s0, s1]) => [[s0, Math.min(s1, g0)], [Math.max(s0, g1), s1]]).filter(([s0, s1]) => s1 - s0 > 0.04);
  }
  return { list: out, len, ux: (e[0] - a[0]) / len, uz: (e[1] - a[1]) / len, a };
}

/** Lay pieces along a span list: `piece(s0, s1)` for consecutive lengths from `next()`, the last one cut to fit. */
function lay(list, next, piece, offset = 0) {
  for (const [s0, s1] of list) {
    let s = s0 - offset;
    while (s < s1 - 0.02) {
      const w = next();
      const a = Math.max(s, s0), b = Math.min(s + w, s1);
      if (b - a > 0.08) piece(a, b);
      s += w;
    }
  }
}

/**
 * A rough interior wall: a sheet on one side, set back from the interior plane by `inset(x, y, z) >= 0` (never into
 * the room), from `y0` to `top(u)`, with the door spans cut out. Faces into the room.
 */
function roughWall(b, key, F, side, { y0 = -0.2, top, inset, col, step = 0.6 }) {
  const { a, b: e, n } = sideLine(F, side);
  const len = Math.hypot(e[0] - a[0], e[1] - a[1]);
  const tmax = Math.max(...[0, 0.25, 0.5, 0.75, 1].map(u => top(u)));
  const nu = Math.max(2, Math.round(len / step)), nv = Math.max(2, Math.round((tmax - y0) / step));
  b.sheet(key, nu, nv, (u, v) => {
    const x = a[0] + (e[0] - a[0]) * u, z = a[1] + (e[1] - a[1]) * u;
    const y = y0 + (top(u) - y0) * v;
    const d = Math.max(0, inset(x, y, z, u, v));
    return [x - n[0] * d, y, z - n[1] * d];
  }, col, (u, v, p) => inDoor(F, side, p[0], p[2], p[1]));
}

/** A ceiling over the interior at `F.T + bump(x, z)` (bump >= 0), facing down. */
function roughCeiling(b, key, F, bump, col, step = 0.7) {
  const nu = Math.max(2, Math.round((F.x1 - F.x0 + 1.2) / step)), nv = Math.max(2, Math.round((F.z1 - F.z0 + 1.2) / step));
  b.sheet(key, nu, nv, (u, v) => {
    const x = F.x0 - 0.6 + (F.x1 - F.x0 + 1.2) * u, z = F.z0 - 0.6 + (F.z1 - F.z0 + 1.2) * v;
    return [x, F.T + Math.max(0, bump(x, z)), z];
  }, col);
}

/** The floor slab under the interior, its walls and its doors, top flush with the floor. */
function floorSlab(b, key, F, pad = WALL_T) {
  b.box(key, [F.x1 - F.x0 + pad * 2, 0.3, F.z1 - F.z0 + pad * 2], [(F.x0 + F.x1) / 2, -0.15, (F.z0 + F.z1) / 2]);
  for (const d of [F.door, ...F.extra]) {
    const r = d.rect;
    b.box(key, [r.x1 - r.x0, 0.3, r.z1 - r.z0], [(r.x0 + r.x1) / 2, -0.15, (r.z0 + r.z1) / 2]);
  }
}

/**
 * THE PORTAL of a buried room: the face of the land at the outer plane of the door's wall, from below the floor up
 * to the land's own height there, the door cut through it, and the door's passage lined to its lintel.
 */
function portal(b, key, F, plan, col, liner = 'timber') {
  const d = F.door;
  const side = d.side;
  const { a, b: e, n } = sideLine(F, side);
  const out = [-n[0] * WALL_T, -n[1] * WALL_T];
  const ax = a[0] + out[0] - (side === 'left' || side === 'right' ? 0 : 0), az = a[1] + out[1];
  // The face runs the width of the room and its two side walls.
  const dirX = e[0] - a[0], dirZ = e[1] - a[1], len = Math.hypot(dirX, dirZ);
  const ux = dirX / len, uz = dirZ / len;
  const p0 = [ax - ux * WALL_T, az - uz * WALL_T], L = len + WALL_T * 2;
  const landAt = (x, z) => { const [wx, wz] = F.toWorld(x, z); return plan.landHeight(wx, wz) - F.floor; };
  const nu = Math.max(4, Math.round(L / 0.6));
  b.sheet(key, nu, 16, (u0, v) => {
    const u = 1 - u0;
    const x = p0[0] + ux * L * u, z = p0[1] + uz * L * u;
    const top = Math.max(F.T + 0.6, landAt(x - n[0] * 0.3, z - n[1] * 0.3) + 0.1);
    const y = -0.4 + (top + 0.4) * v;
    const rough = 0.05 + 0.25 * fbm2(x * 0.8 + z * 0.8, y * 0.8, 3, 2) * smooth(0, 0.1, v);
    return [x + n[0] * rough * 0, y, z + n[1] * 0];
  }, col, (u, v, p) => {
    const al = alongOf(side, p[0], p[2]);
    return al > d.lo + 0.02 && al < d.hi - 0.02 && p[1] < d.top - 0.02;
  });
  // The passage through the wall: two cheeks and a lintel, lined.
  const r = d.rect;
  const deep = side === 'front' || side === 'back';
  const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
  const w = deep ? r.x1 - r.x0 : r.z1 - r.z0, dp = deep ? r.z1 - r.z0 : r.x1 - r.x0;
  for (const s of [-1, 1]) {
    const off = s * (w / 2 + 0.09);
    b.box(liner, deep ? [0.16, d.top, dp + 0.04] : [dp + 0.04, d.top, 0.16], deep ? [cx + off, d.top / 2, cz] : [cx, d.top / 2, cz + off]);
  }
  b.box(liner, deep ? [w + 0.34, 0.24, dp + 0.04] : [dp + 0.04, 0.24, w + 0.34], [cx, d.top + 0.12, cz]);
}

/* ======================================================================
   THE PARTS KIT (machinery: ordinary bodies the world bakes)
   ====================================================================== */

function kitFor(w) {
  const own = (...o) => w.own(...o);
  const t4 = w.t4;
  const M = w.M;
  const shade = m => { m.castShadow = m.receiveShadow = t4; return m; };
  const box = (g, [sx, sy, sz], mat, [x, y, z], rot = null, shadow = false) => {
    const m = new THREE.Mesh(own(new THREE.BoxGeometry(sx, sy, sz)), mat);
    m.position.set(x, y, z);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    if (shadow) shade(m);
    g.add(m);
    return m;
  };
  const cyl = (g, [rt, rb, h, seg = 14], mat, [x, y, z], rot = null, shadow = false) => {
    const m = new THREE.Mesh(own(new THREE.CylinderGeometry(rt, rb, h, seg)), mat);
    m.position.set(x, y, z);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    if (shadow) shade(m);
    g.add(m);
    return m;
  };
  const strut = (g, a, b, r, mat, seg = 8) => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const len = va.distanceTo(vb);
    const m = new THREE.Mesh(own(new THREE.CylinderGeometry(r, r, len, seg)), mat);
    m.position.copy(va).add(vb).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(UP, vb.clone().sub(va).normalize());
    g.add(m);
    return m;
  };
  const cable = (g, pts, r, mat = M.rubber) => {
    const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
    const m = new THREE.Mesh(own(new THREE.TubeGeometry(curve, Math.max(8, pts.length * 6), r, 6, false)), mat);
    g.add(m);
    return m;
  };
  /** A pendant work lamp hung on a rod from `ceil` down to `y`, over (x, z): a pooled lamp mark and its fixture. */
  const pendant = (g, x, y, z, ceil, { intensity = 9, distance = 13 } = {}) => {
    const rodH = Math.max(0.15, ceil - (y + 0.2));
    cyl(g, [0.016, 0.016, rodH, 6], M.darkSteel, [x, y + 0.2 + rodH / 2, z]);
    cyl(g, [0.15, 0.26, 0.13, 12], M.darkSteel, [x, y + 0.14, z]);
    cyl(g, [0.08, 0.08, 0.16, 10], M.lantern, [x, y, z]);
    const mark = new THREE.Object3D();
    mark.position.set(x, y - 0.08, z);
    mark.userData.lamp = { color: LANTERN, intensity, distance, decay: 1.6 };
    g.add(mark);
    w.lamps.push(mark);
  };
  /** A shelf rack: two uprights each end, `n` shelves, `fill(shelfY)` stocks each. */
  const rack = (g, x, z, len, depth, h, n, alongX, fill = null) => {
    const ends = alongX ? [[x - len / 2, z], [x + len / 2, z]] : [[x, z - len / 2], [x, z + len / 2]];
    for (const [ex, ez] of ends) {
      for (const s of [-1, 1]) {
        const [ox, oz] = alongX ? [ex, ez + s * (depth / 2 - 0.03)] : [ex + s * (depth / 2 - 0.03), ez];
        box(g, [0.05, h, 0.05], M.darkSteel, [ox, h / 2, oz]);
      }
    }
    for (let k = 0; k < n; k++) {
      const y = 0.25 + k * ((h - 0.35) / Math.max(1, n - 1));
      box(g, alongX ? [len, 0.035, depth] : [depth, 0.035, len], M.steel, [x, y, z]);
      if (fill) fill(y + 0.02);
    }
  };
  return { box, cyl, strut, cable, pendant, rack, shade, own, t4, M };
}

function benchOf(w, siteId) {
  const p = HOST_PLAN[siteId];
  return buildLfBench(w.ctx, { kind: p.kind, plate: p.plate, skin: p.skin });
}

/** Start a host: its group, its bench at the origin, its shell buckets and its frame. */
function begin(w, idx, name) {
  const rm = ROOMS[idx];
  const F = frameOf(rm);
  const g = new THREE.Group();
  g.name = name;
  const bench = benchOf(w, rm.site);
  g.add(bench.group);
  return { rm, F, g, bench, k: kitFor(w), b: new Buckets(), colliders: [PLATE] };
}

/** Finish a host: build its shell from the buckets and hand back the host. */
function finish(w, h, shellName) {
  const shell = h.b.build(w.M, shellName, { shadows: w.t4 });
  h.g.add(shell);
  return { group: h.g, bench: h.bench, benchLocal: [0, 0, 0], colliders: h.colliders, shell, room: h.rm.id };
}

/* ======================================================================
   SECTION COLOURS (vertex-painted interiors)
   ====================================================================== */

const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
/** Blue glacier ice, with bubbly white bands and the odd dark band of old dirt. */
const glacierIce = (x, y, z) => {
  const band = Math.sin(y * 2.3 + fbm2(x * 0.15 + z * 0.15, y * 0.1, 55, 2) * 4);
  let c = mix3([0.62, 0.78, 0.9], [0.30, 0.52, 0.70], smooth(0.5, -0.5, band));
  if (Math.abs(Math.sin(y * 0.8 + x * 0.05)) < 0.05) c = mix3(c, [0.3, 0.32, 0.33], 0.55);
  return c;
};
/** Lake ice: clearer and greener than glacier ice, with bubble streaks. */
const lakeIceCol = (x, y, z) => mix3([0.58, 0.74, 0.78], [0.78, 0.88, 0.9], fbm2(x * 0.6 + z * 0.4, y * 1.5, 57, 2));
/** Moraine: grey till full of cobbles. */
const till = (x, y, z) => {
  const w = fbm2(x * 1.1 + z * 1.1, y * 1.3, 61, 3);
  return mix3([0.56, 0.55, 0.53], [0.29, 0.29, 0.3], smooth(0.52, 0.7, w));
};
/** Nunatak rock: a dark gneiss, banded, with pale quartz streaks. */
const gneiss = (x, y, z) => {
  const band = Math.sin(y * 3.1 + x * 0.6 + fbm2(x * 0.3 + z * 0.3, y * 0.3, 65, 2) * 3);
  let c = mix3([0.22, 0.23, 0.25], [0.38, 0.37, 0.36], smooth(-0.3, 0.6, band));
  if (band > 0.93) c = mix3(c, [0.72, 0.72, 0.7], 0.6);
  return c;
};

/* ======================================================================
   1. THE FLUME CAVE (site-1, q1-wave — Light Waves)
   A cave under the pressure ridge on the lake ice at the east shore: rafted slabs lean together over a hollow.
   The flume runs along the back wall, fed with lake water through a hole cut in the floor's ice.
   ====================================================================== */

function buildFlumeCave(w) {
  const h = begin(w, 0, 'flume-cave');
  const { F, g, k, b } = h;
  const M = w.M;
  const r = rng(101);

  // THE SHELL: a floor of lake ice, walls of slabs leaning in from their feet, a roof of slabs rafted across.
  floorSlab(b, 'slab', F);
  for (const side of SIDES) {
    const { n } = sideLine(F, side);
    const theta = Math.atan2(n[0], n[1]);
    // Below the door's head: slabs standing (each leans in from its foot on the wall's line).
    const low = spans(F, side, 0);
    lay(low.list, () => 1.3 + r() * 1.1, (s0, s1) => {
      const mid = (s0 + s1) / 2;
      const H = F.T + 0.5 + r() * 0.8;
      const geo = new THREE.BoxGeometry(s1 - s0 + 0.12, H, 0.7);
      geo.translate(0, H / 2, -0.35);
      geo.rotateX(0.05 + r() * 0.05);
      geo.rotateY(theta);
      geo.translate(low.a[0] + low.ux * mid, -0.3, low.a[1] + low.uz * mid);
      b.add('slab', geo);
    });
    // Over each door: a slab laid across as a lintel, and slabs stood on it to the roof.
    for (const d of doorsOn(F, side)) {
      const mid = (d.lo + d.hi) / 2;
      const along = side === 'front' || side === 'back';
      const c = along ? [mid, side === 'front' ? F.z1 + 0.35 : F.z0 - 0.35] : [side === 'left' ? F.x0 - 0.35 : F.x1 + 0.35, mid];
      const L = d.hi - d.lo + 1.0;
      b.box('slab', along ? [L, 0.5, 0.75] : [0.75, 0.5, L], [c[0], d.top + 0.25, c[1]]);
      const hh = F.T + 0.6 - (d.top + 0.5);
      b.box('slab', along ? [L - 0.2, hh, 0.7] : [0.7, hh, L - 0.2], [c[0], d.top + 0.5 + hh / 2, c[1]]);
    }
  }
  // The roof: slabs rafted across from the back to the front, each lapping the next.
  for (let i = 0; i < 9; i++) {
    const z = F.z0 - 0.6 + i * ((F.z1 - F.z0 + 1.2) / 8.5);
    const tilt = (i % 2 ? 1 : -1) * (0.08 + r() * 0.06);
    b.box('slab', [F.x1 - F.x0 + 2.4, 0.55, 2.1], [(F.x0 + F.x1) / 2, F.T + 0.4 + Math.abs(tilt) * 1.1, z], [tilt, (r() - 0.5) * 0.08, (r() - 0.5) * 0.06]);
  }
  // The ridge heaped round it: more slabs piled against the outside, and the snow drifted on them.
  for (let i = 0; i < 26; i++) {
    const side = SIDES[i % 4];
    if (side === F.door.side && i < 20) continue;
    const { a, b: e, n } = sideLine(F, side);
    const t = r();
    const x = a[0] + (e[0] - a[0]) * t - n[0] * (1.6 + r() * 1.4), z = a[1] + (e[1] - a[1]) * t - n[1] * (1.6 + r() * 1.4);
    if (side === F.door.side) continue;
    b.box('slab', [1.8 + r() * 1.6, 0.4, 1.2 + r()], [x, 0.5 + r() * 1.8, z], [0.6 + r() * 0.6, r() * 3, (r() - 0.5) * 0.6]);
  }

  // THE FLUME along the back wall: trestles, a trough of glass and steel, the water in it.
  const fz = F.z0 + 1.0, fl = 11.6;
  for (const x of [-5.4, -2.7, 0, 2.7, 5.4]) {
    for (const dz of [-0.45, 0.45]) k.box(g, [0.1, 0.62, 0.1], M.darkSteel, [x, 0.31, fz + dz]);
    k.box(g, [0.1, 0.08, 1.0], M.darkSteel, [x, 0.6, fz]);
  }
  k.box(g, [fl, 0.06, 1.0], M.steel, [0, 0.67, fz], null, true);
  k.box(g, [fl, 0.62, 0.05], M.steel, [0, 0.98, fz - 0.48]);
  k.box(g, [fl, 0.62, 0.03], M.glass, [0, 0.98, fz + 0.48]);
  for (const x of [-fl / 2, fl / 2]) k.box(g, [0.05, 0.62, 1.0], M.steel, [x, 0.98, fz]);
  k.box(g, [fl - 0.1, 0.03, 0.9], M.water, [0, 1.12, fz]);
  // The scale along the trough's lip: a tick every 45 cm.
  for (let x = -5.4; x <= 5.41; x += 0.45) k.box(g, [0.02, 0.02, 0.08], M.paper, [x, 1.3, fz + 0.5]);
  // The paddle at the west end, its crank and motor; the beach at the east end.
  k.box(g, [0.06, 0.55, 0.85], M.darkSteel, [-5.55, 1.05, fz]);
  k.box(g, [0.5, 0.4, 0.5], M.darkSteel, [-6.25, 1.5, fz]);
  k.strut(g, [-6.0, 1.5, fz], [-5.55, 1.3, fz], 0.03, M.steel);
  k.box(g, [1.0, 0.04, 0.9], M.steel, [5.2, 0.92, fz], [0, 0, 0.35]);
  // The strobe gantry over the trough, and its boom carrying the work lamp out over the plate.
  for (const x of [-3.6, 3.6]) k.box(g, [0.12, 4.2, 0.12], M.darkSteel, [x, 2.1, F.z0 + 0.35], null, true);
  k.box(g, [7.4, 0.14, 0.14], M.darkSteel, [0, 4.2, F.z0 + 0.35]);
  k.box(g, [0.36, 0.3, 0.3], M.caseDark, [0, 3.95, F.z0 + 0.7]);
  k.strut(g, [0, 4.25, F.z0 + 0.35], [0, 4.25, -0.6], 0.035, M.darkSteel);
  k.pendant(g, 0, 3.3, -0.6, 4.25);
  // The intake: a hole cut through the floor's ice to the lake, the pump over it and the hose to the paddle end.
  const hx = F.x0 + 1.4, hz = F.z0 + 3.2;
  k.cyl(g, [0.55, 0.55, 0.02, 20], M.water, [hx, 0.012, hz]);
  k.box(g, [0.5, 0.45, 0.4], M.darkSteel, [hx + 0.2, 0.25, hz + 1.0]);
  k.cable(g, [[hx + 0.2, 0.4, hz + 0.75], [hx + 0.1, 0.6, hz - 0.6], [-6.2, 1.2, fz + 0.3]], 0.05);
  h.colliders.push({ lx: 0, lz: fz, hw: fl / 2 + 0.9, hd: 0.6 }, { lx: hx + 0.2, lz: hz + 0.5, hw: 0.7, hd: 0.8 });
  // The lamp by the door.
  k.pendant(g, F.door.lo - 0.8, 3.1, F.z1 - 1.0, F.T + 0.3, { intensity: 6, distance: 10 });
  return finish(w, h, 'flume-cave-shell');
}

/* ======================================================================
   2. THE MAST VAULT (site-2, q2-photon — Photons)
   A vault dug into the ice-cored east moraine under the aurora mast's foot: steel sets, timber cribbing, lagging.
   The mast's photocell cable comes down a lined shaft through the roof into the housing behind the plate.
   ====================================================================== */

function buildMastVault(w, plan) {
  const h = begin(w, 1, 'mast-vault');
  const { F, g, k, b } = h;
  const M = w.M;

  floorSlab(b, 'footing', F);
  // The moraine behind the cribbing, seen in the gaps between the logs.
  for (const side of SIDES) {
    roughWall(b, 'faceTill', F, side, { top: () => F.T + 0.3, inset: (x, y, z) => 0.45 + 0.2 * fbm2(x + z, y, 9, 2), col: till });
  }
  roughCeiling(b, 'faceTill', F, (x, z) => 0.5 + 0.2 * fbm2(x * 0.5, z * 0.5, 11, 2), till);
  // Steel sets every 2.4 m along each side, a cap beam across the vault on each pair, lagging boards on the caps.
  const sets = [];
  for (let z = F.z0 + 0.3; z <= F.z1 - 0.2; z += 2.4) sets.push(z);
  for (const z of sets) {
    for (const x of [F.x0 + 0.12, F.x1 - 0.12]) b.box('darkSteel', [0.2, F.T, 0.22], [x, F.T / 2, z]);
    b.box('darkSteel', [F.x1 - F.x0, 0.26, 0.22], [(F.x0 + F.x1) / 2, F.T - 0.13, z]);
  }
  for (let x = F.x0 + 0.1; x < F.x1; x += 0.36) b.box('timber', [0.3, 0.06, F.z1 - F.z0 + 0.3], [x + 0.15, F.T + 0.03, (F.z0 + F.z1) / 2]);
  // Cribbing: horizontal logs laid along the walls behind the sets, a hand's breadth apart, cut round the door.
  for (const side of SIDES) {
    const { n } = sideLine(F, side);
    for (let y = 0.15; y < F.T; y += 0.42) {
      const sp = spans(F, side, y - 0.16, 0);
      for (const [s0, s1] of sp.list) {
        const mid = (s0 + s1) / 2;
        b.cyl('timber', 0.16, 0.16, s1 - s0, 8,
          [sp.a[0] + sp.ux * mid - n[0] * 0.2, y, sp.a[1] + sp.uz * mid - n[1] * 0.2], Math.abs(sp.ux) > 0.5 ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0]);
      }
    }
  }
  portal(b, 'faceTill', F, plan, till, 'timber');

  // THE PHOTOCELL HOUSING behind the plate, on a plinth, its lens tube up into the shaft to the mast.
  k.box(g, [3.4, 0.3, 1.2], M.footing, [0, 0.15, F.z0 + 0.9]);
  k.box(g, [2.6, 1.6, 0.9], M.darkSteel, [0, 1.1, F.z0 + 0.9], null, true);
  k.box(g, [2.2, 1.1, 0.03], M.case, [0, 1.15, F.z0 + 1.36]);
  k.cyl(g, [0.22, 0.22, F.T - 1.9, 16], M.steel, [0.6, 1.9 + (F.T - 1.9) / 2, F.z0 + 0.9], null, true);
  // The shaft through the roof: a square of boards round the tube, rising into the moraine.
  for (const [dx, dz, sx, sz] of [[-0.45, 0, 0.08, 0.98], [0.45, 0, 0.08, 0.98], [0, -0.45, 0.82, 0.08], [0, 0.45, 0.82, 0.08]]) {
    b.box('timber', [sx, 3.0, sz], [0.6 + dx, F.T + 1.5, F.z0 + 0.9 + dz]);
  }
  // The battery racks down the left wall, and the conduit to the housing.
  k.rack(g, F.x0 + 0.9, F.z0 + 3.6, 4.6, 0.8, 1.8, 3, false, y => {
    for (let i = 0; i < 6; i++) k.box(g, [0.5, 0.32, 0.36], M.caseDark, [F.x0 + 0.9, y + 0.16, F.z0 + 1.6 + i * 0.75]);
  });
  k.cable(g, [[F.x0 + 1.3, 1.9, F.z0 + 1.4], [F.x0 + 1.3, 2.8, F.z0 + 0.6], [-2.2, 2.8, F.z0 + 0.5], [-1.3, 1.6, F.z0 + 0.9]], 0.04);
  // The plate case on a trestle on the right, its lid thrown back.
  k.box(g, [1.6, 0.9, 0.7], M.timber, [F.x1 - 1.4, 0.45, -0.4]);
  k.box(g, [1.3, 0.3, 0.55], M.caseDark, [F.x1 - 1.4, 1.05, -0.4]);
  for (let i = 0; i < 3; i++) k.box(g, [0.02, 0.36, 0.4], M.steel, [F.x1 - 1.85 + i * 0.3, 1.25, -0.4]);
  h.colliders.push({ lx: 0, lz: F.z0 + 0.9, hw: 1.8, hd: 0.7 }, { lx: F.x0 + 0.9, lz: F.z0 + 3.6, hw: 0.5, hd: 2.4 }, { lx: F.x1 - 1.4, lz: -0.4, hw: 0.9, hd: 0.45 });
  k.pendant(g, 0, 3.3, -0.6, F.T - 0.26);
  k.pendant(g, 0, 3.2, F.z1 - 1.6, F.T - 0.26, { intensity: 6, distance: 10 });
  return finish(w, h, 'mast-vault-shell');
}

/* ======================================================================
   3. THE MELTWATER CAVE (site-3, q3-lines — Line Spectra)
   A cave melted along the glacier's east margin: a barrel of scalloped blue ice. The spectrograph sled is parked in it.
   ====================================================================== */

function buildMeltCave(w, plan) {
  const h = begin(w, 2, 'melt-cave');
  const { F, g, k, b } = h;
  const M = w.M;
  const cx = (F.x0 + F.x1) / 2, half = (F.x1 - F.x0) / 2;
  const SPRING = 2.0;
  const vaultY = x => SPRING + (F.T - SPRING) * Math.sqrt(Math.max(0, 1 - ((x - cx) / (half + 0.01)) ** 2));
  // Meltwater scallops: shallow dished hollows the water's eddies cut, always INTO the ice.
  const scallop = (x, y, z) => 0.12 + 0.22 * Math.abs(Math.sin(x * 2.1 + fbm2(z * 0.7, y * 0.7, 71, 2) * 3) * Math.sin(y * 2.4 + z * 1.3));

  floorSlab(b, 'faceIce', F);
  // The barrel: one sheet from the left wall's foot over the crown to the right wall's foot, along z.
  const nu = 40, nv = Math.round((F.z1 - F.z0) / 0.5);
  const door = F.door;
  const WALLU = 0.08;
  const cutX = cx + 5.2;
  b.sheet('faceIce', nu, nv, (u, v) => {
    const z = F.z0 + (F.z1 - F.z0) * v;
    let x, y, nx, ny;
    if (u < WALLU || u > 1 - WALLU) {
      const left = u < WALLU;
      const t = left ? u / WALLU : (1 - u) / WALLU;
      x = left ? F.x0 : F.x1; y = -0.2 + (SPRING + 0.2) * t; nx = left ? -1 : 1; ny = 0;
    } else {
      const t = Math.PI * (1 - (u - WALLU) / (1 - 2 * WALLU));
      x = cx + Math.cos(t) * half; y = SPRING + (F.T - SPRING) * Math.sin(t); nx = Math.cos(t); ny = Math.sin(t);
    }
    const d = scallop(x, y, z);
    return [x + nx * d, y + ny * d, z];
  }, glacierIce, (u, v, p) => door.side === 'right' && p[0] > cutX && p[2] > door.lo - 0.05 && p[2] < door.hi + 0.05 && p[1] < door.top + 0.35);
  // The two ends of the barrel: faces of ice up to the vault.
  for (const side of ['back', 'front']) {
    roughWall(b, 'faceIce', F, side, { top: u => vaultY(side === 'back' ? F.x0 + (F.x1 - F.x0) * u : F.x1 - (F.x1 - F.x0) * u) + 0.4, inset: scallop, col: glacierIce, step: 0.5 });
  }
  // The side door's alcove, where the barrel comes down too low to pass: two cheeks of ice and a lintel.
  if (door.side === 'right') {
    for (const zz of [door.lo - 0.12, door.hi + 0.12]) b.box('faceIce', [F.x1 - cutX + 0.1, door.top + 0.4, 0.24], [(cutX + F.x1) / 2, (door.top + 0.4) / 2 - 0.05, zz]);
    b.box('faceIce', [F.x1 - cutX + 0.1, 0.4, door.hi - door.lo + 0.48], [(cutX + F.x1) / 2, door.top + 0.2, (door.lo + door.hi) / 2]);
    h.colliders.push({ lx: (cutX + F.x1) / 2, lz: door.lo - 0.12, hw: (F.x1 - cutX) / 2 + 0.05, hd: 0.12 }, { lx: (cutX + F.x1) / 2, lz: door.hi + 0.12, hw: (F.x1 - cutX) / 2 + 0.05, hd: 0.12 });
  }
  portal(b, 'faceIce', F, plan, glacierIce, 'darkSteel');

  // THE SPECTROGRAPH SLED, parked down the left of the plate, nose to the back wall.
  const sx = -4.4, sz0 = F.z0 + 0.4, sl = 5.0;
  for (const dx of [-0.9, 0.9]) {
    k.box(g, [0.1, 0.12, sl], M.timber, [sx + dx, 0.08, sz0 + sl / 2]);
    k.box(g, [0.1, 0.1, 0.5], M.timber, [sx + dx, 0.22, sz0 + 0.1], [0.6, 0, 0]);
  }
  k.box(g, [2.0, 0.08, sl - 0.4], M.timber, [sx, 0.5, sz0 + sl / 2]);
  for (const z of [sz0 + 0.6, sz0 + 2.4, sz0 + 4.2]) for (const dx of [-0.85, 0.85]) k.box(g, [0.08, 0.36, 0.08], M.timber, [sx + dx, 0.28, z]);
  // The instrument on the bed: slit box, collimator, prism table, camera on its bellows.
  k.box(g, [0.5, 0.4, 0.4], M.caseDark, [sx, 0.75, sz0 + 0.8]);
  k.cyl(g, [0.11, 0.11, 1.2, 14], M.steel, [sx, 0.8, sz0 + 1.6], [Math.PI / 2, 0, 0]);
  k.cyl(g, [0.32, 0.32, 0.14, 18], M.darkSteel, [sx, 0.62, sz0 + 2.45]);
  k.box(g, [0.24, 0.22, 0.24], M.glass, [sx, 0.8, sz0 + 2.45], [0, 0.6, 0]);
  k.box(g, [0.36, 0.36, 0.8], M.rubber, [sx + 0.3, 0.8, sz0 + 3.1], [0, 0.5, 0]);
  k.box(g, [0.48, 0.44, 0.3], M.caseDark, [sx + 0.62, 0.82, sz0 + 3.55], [0, 0.5, 0]);
  // The tube rack and the spare filament lamp at the bed's tail.
  k.box(g, [0.8, 0.12, 0.26], M.timber, [sx, 0.6, sz0 + 4.3]);
  for (let i = 0; i < 4; i++) k.cyl(g, [0.035, 0.035, 0.42, 8], M.glass, [sx - 0.3 + i * 0.2, 0.83, sz0 + 4.3]);
  k.cyl(g, [0.07, 0.05, 0.2, 10], M.case, [sx + 0.55, 0.64, sz0 + 4.0]);
  // The cover drawn back over the camera end.
  k.box(g, [2.0, 0.04, 1.4], M.tarp, [sx, 1.22, sz0 + 3.4], [0, 0, 0.05]);
  h.colliders.push({ lx: sx, lz: sz0 + sl / 2, hw: 1.1, hd: sl / 2 + 0.15 });
  // A drum of meltwater frozen solid in the cave's corner, and the hose that filled it.
  k.cyl(g, [0.3, 0.3, 0.85, 14], M.darkSteel, [F.x1 - 0.8, 0.43, F.z0 + 0.8]);
  h.colliders.push({ lx: F.x1 - 0.8, lz: F.z0 + 0.8, r: 0.45 });
  k.pendant(g, 0, 3.3, -0.6, vaultY(0));
  k.pendant(g, cx + 3.4, 3.0, (door.lo + door.hi) / 2, vaultY(cx + 3.4), { intensity: 6, distance: 10 });
  return finish(w, h, 'melt-cave-shell');
}

/* ======================================================================
   4. THE CRAWLER'S DRILL HALL (site-4, q4-cloud — Orbitals)
   The ice-core drilling crawler parked north of the crossing on its scraped apron, its tailgate down to the track.
   The hall is a ribbed steel box on the crawler's deck; the drill tower stands up through its roof behind the plate.
   ====================================================================== */

function buildDrillHall(w) {
  const h = begin(w, 3, 'drill-hall');
  const { F, g, k, b } = h;
  const M = w.M;
  const DECK = 1.4;            // the hall's floor above the apron
  const cx = (F.x0 + F.x1) / 2, cz = (F.z0 + F.z1) / 2;
  const W = F.x1 - F.x0 + WALL_T * 2, L = F.z1 - F.z0 + WALL_T * 2;

  // THE CRAWLER: deck, hull under it, a track and its road wheels down each side, the cab at the far end.
  b.box('darkSteel', [W, 0.3, L], [cx, -0.15, cz]);
  b.box('steel', [W - 0.4, DECK - 0.3, L - 0.6], [cx, -0.3 - (DECK - 0.3) / 2, cz]);
  for (const s of [-1, 1]) {
    const tx = cx + s * (W / 2 + 0.9);
    b.box('rubber', [1.6, 1.3, L + 4.0], [tx, -DECK + 0.65, cz - 1.3]);
    for (let i = 0; i < 8; i++) b.cyl('darkSteel', 0.45, 0.45, 0.3, 14, [tx + s * 0.82, -DECK + 0.6, F.z0 - 2.6 + i * ((L + 2.6) / 7)], [0, 0, Math.PI / 2]);
    b.box('darkSteel', [1.8, 0.12, L + 4.2], [tx, 0.0, cz - 1.3]);
  }
  b.box('steel', [W - 1, 3.0, 2.4], [cx, 1.5, F.z0 - WALL_T - 1.2]);
  b.box('steel', [W - 0.4, DECK, 2.6], [cx, -DECK / 2, F.z0 - WALL_T - 1.3]);
  b.box('glassDark', [W - 1.6, 0.9, 0.04], [cx, 2.2, F.z0 - WALL_T - 2.42]);
  // THE HALL: ribbed panels on every side (cut to the door), a rib at every other joint, the roof on beams.
  for (const side of SIDES) {
    const { n } = sideLine(F, side);
    for (const [y0, y1] of [[0, F.door.top], [F.door.top, F.T]]) {
      const sp = spans(F, side, y0 + 0.01);
      let joint = 0;
      lay(sp.list, () => 1.0, (s0, s1) => {
        const mid = (s0 + s1) / 2;
        const x = sp.a[0] + sp.ux * mid - n[0] * WALL_T / 2, z = sp.a[1] + sp.uz * mid - n[1] * WALL_T / 2;
        const along = Math.abs(sp.ux) > 0.5;
        b.box('clad', along ? [s1 - s0, y1 - y0, WALL_T] : [WALL_T, y1 - y0, s1 - s0], [x, (y0 + y1) / 2, z]);
        if (y0 === 0 && (joint++ % 2 === 0) && s0 > 0.1 && s0 < sp.len - 0.1) {
          const jx = sp.a[0] + sp.ux * s0 - n[0] * (WALL_T + 0.1), jz = sp.a[1] + sp.uz * s0 - n[1] * (WALL_T + 0.1);
          b.box('darkSteel', along ? [0.14, F.T, 0.2] : [0.2, F.T, 0.14], [jx, F.T / 2, jz]);
        }
      });
    }
  }
  b.box('clad', [W + 0.2, 0.3, L + 0.2], [cx, F.T + 0.45, cz]);
  for (let z = F.z0 + 0.6; z < F.z1; z += 2.0) b.box('darkSteel', [F.x1 - F.x0, 0.3, 0.18], [cx, F.T + 0.15, z]);
  // THE TAILGATE: a steel ramp from the door down to the crossing, on its hinge, with its chains.
  const tl = 7.0;
  const ty0 = 0, ty1 = -DECK;
  const tg = new THREE.BoxGeometry(F.door.hi - F.door.lo + 0.6, 0.12, Math.hypot(tl, DECK));
  tg.rotateX(Math.atan2(DECK, tl));
  tg.translate((F.door.lo + F.door.hi) / 2, (ty0 + ty1) / 2 - 0.07, F.z1 + WALL_T + tl / 2);
  b.add('darkSteel', tg);
  for (const s of [-1, 1]) {
    b.rod('darkSteel', [(F.door.lo + F.door.hi) / 2 + s * 2.4, DECK * 0 + 2.6, F.z1 + WALL_T * 0.5], [(F.door.lo + F.door.hi) / 2 + s * 2.4, ty1 + 0.4, F.z1 + WALL_T + tl - 0.4], 0.025);
  }

  // THE DRILL TOWER behind the plate, up through the roof: four legs, the crown sheave, the core barrel hanging.
  const tz = F.z0 + 1.1;
  for (const [dx, dz] of [[-0.6, -0.6], [0.6, -0.6], [0.6, 0.5], [-0.6, 0.5]]) k.box(g, [0.12, 12, 0.12], M.paintRed || M.darkSteel, [dx, 6, tz + dz]);
  for (let y = 1.2; y < 12; y += 1.6) {
    k.box(g, [1.3, 0.06, 0.06], M.darkSteel, [0, y, tz - 0.6]);
    k.box(g, [0.06, 0.06, 1.2], M.darkSteel, [-0.6, y, tz]);
    k.box(g, [0.06, 0.06, 1.2], M.darkSteel, [0.6, y, tz]);
  }
  k.cyl(g, [0.35, 0.35, 0.12, 16], M.steel, [0, 12.1, tz], [0, 0, Math.PI / 2]);
  k.cyl(g, [0.07, 0.07, 3.2, 10], M.steel, [0, 2.4, tz - 0.05]);
  k.cyl(g, [0.5, 0.5, 0.3, 18], M.darkSteel, [0, 0.15, tz - 0.05]);
  // Core barrels in racks down the right wall; the cloud chamber's cabinet and its cold plate on the left.
  k.rack(g, F.x1 - 0.8, cz - 0.4, 6.4, 0.9, 1.7, 4, false, y => {
    for (let i = 0; i < 4; i++) k.cyl(g, [0.06, 0.06, 1.4, 10], M.steel, [F.x1 - 0.8 - 0.2 + (i % 2) * 0.4, y + 0.07, cz - 2.2 + i * 1.3], [Math.PI / 2, 0, 0]);
  });
  k.box(g, [1.2, 1.6, 2.0], M.caseDark, [F.x0 + 0.9, 0.8, F.z0 + 1.6], null, true);
  k.box(g, [0.9, 0.08, 0.9], M.steel, [F.x0 + 0.9, 1.64, F.z0 + 1.2]);
  k.cyl(g, [0.38, 0.38, 0.4, 20], M.glass, [F.x0 + 0.9, 1.88, F.z0 + 1.2]);
  k.box(g, [1.0, 0.9, 1.4], M.darkSteel, [F.x0 + 0.9, 0.45, F.z0 + 4.2]);
  h.colliders.push({ lx: 0, lz: tz, hw: 0.8, hd: 0.8 }, { lx: F.x1 - 0.8, lz: cz - 0.4, hw: 0.55, hd: 3.3 }, { lx: F.x0 + 0.9, lz: F.z0 + 2.6, hw: 0.7, hd: 2.4 });
  k.pendant(g, 0, 3.3, -0.6, F.T);
  k.pendant(g, 0, 3.2, F.z1 - 1.5, F.T, { intensity: 6, distance: 10 });
  return finish(w, h, 'drill-hall-shell');
}

/* ======================================================================
   5. THE RECORDS TENT (site-5, q5-numbers — Quantum Numbers)
   At the foot of the cut ramp into a crevasse, the records tent is pitched along the crevasse's floor between its ice
   walls, under the snow bridge. Canvas on timber hoops; its far end is the board; a door in its side to the annexe.
   ====================================================================== */

function buildRecordsTent(w, plan) {
  const h = begin(w, 4, 'records-tent');
  const { F, g, k, b } = h;
  const M = w.M;
  const cx = (F.x0 + F.x1) / 2, half = (F.x1 - F.x0) / 2 - 0.05;
  const SPRING = 1.4;
  const hoop = x => SPRING + (F.T - 0.1 - SPRING) * Math.sqrt(Math.max(0, 1 - ((x - cx) / half) ** 2));
  const crevasse = (x, y, z) => 0.3 + y * 0.12 + 0.3 * fbm2(x * 0.5 + z * 0.5, y * 0.5, 75, 2);

  floorSlab(b, 'timber', F);
  // THE CREVASSE: its two long walls of ice leaning apart as they rise (a crevasse narrows with depth), the ends
  // pinched, and the snow bridge over it.
  for (const side of SIDES) {
    if (side === F.shared) continue;
    roughWall(b, 'faceIce', F, side, { top: () => F.T + 1.2, inset: crevasse, col: glacierIce });
  }
  roughCeiling(b, 'snowBridge', F, (x, z) => 1.1 + 0.6 * fbm2(x * 0.3, z * 0.3, 77, 2), null);
  portal(b, 'faceIce', F, plan, glacierIce, 'timber');
  // THE TENT: hoops across the crevasse every 1.6 m, the canvas over them, its ends closed but for the doors. A door in
  // the tent's side (the way in from the crevasse ramp) is framed through the canvas; a door in an end is cut in it.
  const allDoors = [F.door, ...F.extra];
  const sideDoors = allDoors.filter(d => d.side === 'left' || d.side === 'right');
  const inSideDoor = (x, z, y, pad = 0.25) => sideDoors.some(d =>
    (d.side === 'right' ? x > cx + half - 1.7 : x < cx - half + 1.7) && z > d.lo - pad && z < d.hi + pad && y < d.top + 0.3);
  for (let z = F.z0 + 0.4; z <= F.z1 - 0.3; z += 1.6) {
    for (let i = 0; i < 16; i++) {
      const xa = cx - half + (2 * half) * (i / 16), xb = cx - half + (2 * half) * ((i + 1) / 16);
      if (inSideDoor((xa + xb) / 2, z, Math.min(hoop(xa), hoop(xb)))) continue;
      b.rod('timber', [xa, hoop(xa), z], [xb, hoop(xb), z], 0.06);
    }
    for (const s of [-1, 1]) if (!inSideDoor(cx + s * half, z, 0)) b.box('timber', [0.12, SPRING, 0.12], [cx + s * half, SPRING / 2, z]);
  }
  b.sheet('canvas', 32, Math.round((F.z1 - F.z0) / 0.8), (u, v) => {
    const x = cx - half - 0.08 + (2 * half + 0.16) * u;
    const z = F.z0 + 0.15 + (F.z1 - F.z0 - 0.3) * v;
    const sag = 0.06 * Math.sin(v * Math.PI * ((F.z1 - F.z0) / 1.6));
    return [x, Math.max(0.02, hoop(Math.min(cx + half, Math.max(cx - half, x)))) + 0.08 - Math.abs(sag), z];
  }, null, (u, v, p) => inSideDoor(p[0], p[2], p[1], 0.2));
  // The tent's ends, canvas on a timber frame, each with its door if it has one.
  for (const [zz, end] of [[F.z0 + 0.15, 'back'], [F.z1 - 0.15, 'front']]) {
    const d = allDoors.find(dd => dd.side === end);
    b.sheet('canvas', 24, 8, (u, v) => {
      const x = cx - half + 2 * half * u;
      return [x, hoop(x) * v, zz];
    }, null, (u, v, p) => d && p[0] > d.lo - 0.1 && p[0] < d.hi + 0.1 && p[1] < d.top + 0.1);
    if (d) {
      for (const xx of [d.lo - 0.08, d.hi + 0.08]) b.box('timber', [0.14, d.top, 0.3], [xx, d.top / 2, zz]);
      b.box('timber', [d.hi - d.lo + 0.3, 0.18, 0.3], [(d.lo + d.hi) / 2, d.top + 0.09, zz]);
    }
  }
  // A side door, framed through the canvas: two posts, a head, and the canvas porch over it.
  for (const d of sideDoors) {
    const sg = d.side === 'right' ? 1 : -1;
    const xx = d.side === 'right' ? F.x1 - 0.1 : F.x0 + 0.1;
    const xm = xx - sg * 0.75;
    for (const zz of [d.lo - 0.08, d.hi + 0.08]) b.box('timber', [1.6, d.top, 0.14], [xm, d.top / 2, zz]);
    b.box('timber', [1.6, 0.18, d.hi - d.lo + 0.3], [xm, d.top + 0.09, (d.lo + d.hi) / 2]);
    const hIn = hoop(xx - sg * 1.5);
    b.box('canvas', [1.5, Math.max(0.2, hIn - d.top), d.hi - d.lo + 0.3], [xm, (d.top + Math.max(d.top + 0.2, hIn)) / 2, (d.lo + d.hi) / 2]);
  }

  // THE BOARD behind the plate: a frame of milled boxes in ladder rows, the board's back face toward the annexe door.
  const bz = F.z0 + 0.9;
  k.box(g, [5.4, 2.4, 0.12], M.timber, [0, 1.25, bz], null, true);
  for (let r = 0; r < 7; r++) {
    const n = 2 + r;
    for (let c = 0; c < n; c++) k.box(g, [0.34, 0.2, 0.04], M.glassDark, [-((n - 1) * 0.42) / 2 + c * 0.42, 0.45 + r * 0.27, bz + 0.08]);
  }
  for (const x of [-2.6, 2.6]) k.box(g, [0.12, 2.5, 0.3], M.darkSteel, [x, 1.25, bz]);
  // The filing cabinets down the right; the stove at the far end, its flue up through the canvas and the snow bridge; a
  // plan table on the left beyond the door.
  for (let i = 0; i < 4; i++) k.box(g, [0.7, 1.35, 0.65], M.darkSteel, [cx + half - 1.1, 0.675, 1.2 + i * 0.75], null, true);
  const stz = F.z1 - 2.6;
  k.cyl(g, [0.32, 0.32, 0.8, 14], M.darkSteel, [cx + half - 1.2, 0.4, stz]);
  k.cyl(g, [0.07, 0.07, F.T + 1.6, 8], M.darkSteel, [cx + half - 1.2, 0.8 + (F.T + 1.6) / 2, stz]);
  const tbz = F.z1 - 3.2;
  k.box(g, [1.6, 0.06, 0.8], M.timber, [cx - half + 1.5, 0.82, tbz]);
  for (const [dx, dz] of [[-0.7, -0.35], [0.7, -0.35], [-0.7, 0.35], [0.7, 0.35]]) k.box(g, [0.05, 0.8, 0.05], M.timber, [cx - half + 1.5 + dx, 0.4, tbz + dz]);
  h.colliders.push({ lx: 0, lz: bz, hw: 2.8, hd: 0.3 }, { lx: cx + half - 1.1, lz: 2.3, hw: 0.45, hd: 1.6 },
    { lx: cx + half - 1.2, lz: stz, r: 0.5 }, { lx: cx - half + 1.5, lz: tbz, hw: 0.85, hd: 0.45 });
  k.pendant(g, 0, 3.3, -0.6, hoop(0));
  const sd = sideDoors[0];
  const lx = sd ? (sd.side === 'right' ? cx + half - 2.6 : cx - half + 2.6) : 0;
  k.pendant(g, lx, 3.1, sd ? (sd.lo + sd.hi) / 2 : F.z1 - 1.4, hoop(lx), { intensity: 6, distance: 10 });
  return finish(w, h, 'records-tent-shell');
}

/* ======================================================================
   6. THE RECORDS ANNEXE (site-6, q6-filling — Electron Configuration)
   A chamber cut square into the crevasse's ice beside the tent: flat cut ceiling, saw-marked walls, the charts in racks.
   ====================================================================== */

function buildRecordsAnnexe(w) {
  const h = begin(w, 5, 'records-annexe');
  const { F, g, k, b } = h;
  const M = w.M;
  // Saw marks: the walls were cut in courses with a chainsaw, each course a band with its grooves.
  const sawn = (x, y, z) => 0.03 + 0.05 * Math.abs(Math.sin(y * 9.0)) + 0.04 * (Math.floor(y / 0.9) % 2);
  floorSlab(b, 'faceIce', F);
  for (const side of SIDES) {
    if (side === F.shared) continue;
    roughWall(b, 'faceIce', F, side, { top: () => F.T + 0.1, inset: sawn, col: glacierIce, step: 0.3 });
  }
  roughCeiling(b, 'faceIce', F, (x, z) => 0.03 * Math.abs(Math.sin(x * 6)), glacierIce, 0.6);

  // The chart racks along the back and the left; the plan tables down the right; a stool.
  k.rack(g, -4.6, F.z0 + 0.6, 4.0, 0.7, 2.2, 5, true, y => {
    for (let i = 0; i < 8; i++) k.cyl(g, [0.05, 0.05, 0.6, 8], M.paper, [-6.2 + i * 0.45, y + 0.06, F.z0 + 0.6], [Math.PI / 2, 0, 0]);
  });
  k.rack(g, 4.6, F.z0 + 0.6, 4.0, 0.7, 2.2, 5, true, y => {
    for (let i = 0; i < 6; i++) k.box(g, [0.5, 0.08, 0.6], M.paper, [3.0 + i * 0.62, y + 0.05, F.z0 + 0.6]);
  });
  k.rack(g, F.x0 + 0.6, 4.0, 5.0, 0.7, 2.2, 4, false, y => {
    for (let i = 0; i < 5; i++) k.box(g, [0.5, 0.3, 0.6], M.caseDark, [F.x0 + 0.6, y + 0.16, 2.0 + i * 1.0]);
  });
  // The board's twin: the order the boxes fill in, in rows of energy, behind the plate.
  k.box(g, [5.2, 2.0, 0.1], M.timber, [0, 1.35, F.z0 + 1.2], null, true);
  for (let r = 0; r < 6; r++) for (let c = 0; c < 1 + (r % 4); c++) k.box(g, [0.3, 0.18, 0.04], M.glassDark, [-2.2 + c * 0.38 + r * 0.22, 0.55 + r * 0.3, F.z0 + 1.27]);
  for (const x of [-2.55, 2.55]) k.box(g, [0.1, 2.35, 0.25], M.darkSteel, [x, 1.17, F.z0 + 1.2]);
  // A plan table near the door (clear of the door's swing and the lane), a stool.
  k.box(g, [1.2, 0.06, 2.0], M.timber, [F.x1 - 1.6, 0.88, 7.2]);
  for (const [dx, dz] of [[-0.5, -0.9], [0.5, -0.9], [-0.5, 0.9], [0.5, 0.9]]) k.box(g, [0.05, 0.86, 0.05], M.timber, [F.x1 - 1.6 + dx, 0.43, 7.2 + dz]);
  k.cyl(g, [0.2, 0.2, 0.6, 10], M.darkSteel, [F.x1 - 2.6, 0.3, 7.4]);
  h.colliders.push({ lx: -4.6, lz: F.z0 + 0.6, hw: 2.1, hd: 0.45 }, { lx: 4.6, lz: F.z0 + 0.6, hw: 2.1, hd: 0.45 },
    { lx: F.x0 + 0.6, lz: 4.0, hw: 0.45, hd: 2.6 }, { lx: 0, lz: F.z0 + 1.2, hw: 2.7, hd: 0.2 },
    { lx: F.x1 - 1.6, lz: 7.2, hw: 0.65, hd: 1.05 }, { lx: F.x1 - 2.6, lz: 7.4, r: 0.25 });
  k.pendant(g, 0, 3.3, -0.6, F.T);
  k.pendant(g, F.x1 - 2.0, 3.2, (F.door.lo + F.door.hi) / 2, F.T, { intensity: 6, distance: 10 });
  return finish(w, h, 'records-annexe-shell');
}

/* ======================================================================
   7. THE NUNATAK CHAMBER (site-7, q7-pes — Photoelectron Spectroscopy)
   A chamber blasted into the nunatak's rock under the tower on its summit: rock bolts, the detector arc behind the plate.
   ====================================================================== */

function buildNunatakChamber(w, plan) {
  const h = begin(w, 6, 'nunatak-chamber');
  const { F, g, k, b } = h;
  const M = w.M;
  const blasted = (x, y, z) => 0.08 + 0.5 * Math.pow(ridge2(x * 0.45 + z * 0.45, y * 0.45, 79, 3), 2);
  floorSlab(b, 'rockFloor', F);
  for (const side of SIDES) roughWall(b, 'rockWall', F, side, { top: () => F.T + 0.4, inset: blasted, col: gneiss, step: 0.45 });
  roughCeiling(b, 'rockWall', F, (x, z) => 0.1 + 0.6 * ridge2(x * 0.35, z * 0.35, 81, 3), gneiss, 0.5);
  portal(b, 'rockWall', F, plan, gneiss, 'darkSteel');
  // Rock bolts on a grid: a square plate and a nut on each, set into the rock (never proud of its face by more than a hand).
  const r = rng(707);
  for (const side of SIDES) {
    const { a, b: e, n } = sideLine(F, side);
    for (let t = 0.08; t < 1; t += 0.13) {
      for (let y = 1.4; y < F.T; y += 1.3) {
        const x = a[0] + (e[0] - a[0]) * t, z = a[1] + (e[1] - a[1]) * t;
        if (inDoor(F, side, x, z, y, 0.4)) continue;
        const d = blasted(x, y, z);
        const px = x - n[0] * d + n[0] * 0.04, pz = z - n[1] * d + n[1] * 0.04;
        b.box('darkSteel', [n[0] ? 0.04 : 0.18, 0.18, n[1] ? 0.04 : 0.18], [px, y + (r() - 0.5) * 0.2, pz]);
      }
    }
  }
  // THE DETECTOR ARC behind the plate: a half ring of detectors on two feet, round a sample chamber on its pedestal.
  const az = F.z0 + 1.0;
  k.cyl(g, [0.45, 0.5, 0.9, 18], M.darkSteel, [0, 0.45, az]);
  k.cyl(g, [0.32, 0.32, 0.5, 18], M.steel, [0, 1.15, az]);
  for (let i = 0; i <= 8; i++) {
    const t = Math.PI * (i / 8);
    const x = Math.cos(t) * 2.2, y = 0.3 + Math.sin(t) * 2.0;
    k.box(g, [0.3, 0.3, 0.4], M.caseDark, [x, y, az], [0, 0, t - Math.PI / 2]);
    if (i < 8) k.strut(g, [x, y, az - 0.25], [Math.cos(Math.PI * ((i + 1) / 8)) * 2.2, 0.3 + Math.sin(Math.PI * ((i + 1) / 8)) * 2.0, az - 0.25], 0.04, M.steel);
  }
  // The source on the left, its tube to the chamber; the specimen rack on the right; the cable from the borehole.
  k.box(g, [0.9, 1.1, 0.8], M.case, [-4.2, 0.55, az - 0.2], null, true);
  k.cyl(g, [0.07, 0.07, 3.6, 10], M.steel, [-2.4, 1.15, az], [0, 0, Math.PI / 2]);
  k.rack(g, 4.6, az, 2.4, 0.6, 1.9, 3, true, y => {
    for (let i = 0; i < 5; i++) k.box(g, [0.3, 0.22, 0.3], M.case, [3.75 + i * 0.42, y + 0.12, az]);
  });
  k.cyl(g, [0.25, 0.25, 0.4, 12], M.darkSteel, [5.8, F.T + 0.1, F.z0 + 0.7]);
  k.cable(g, [[5.8, F.T, F.z0 + 0.7], [5.6, 3.0, F.z0 + 0.5], [5.3, 1.8, az - 0.3], [2.4, 0.5, az - 0.4]], 0.04);
  h.colliders.push({ lx: 0, lz: az, hw: 2.5, hd: 0.45 }, { lx: -4.2, lz: az - 0.2, hw: 0.55, hd: 0.5 }, { lx: 4.6, lz: az, hw: 1.3, hd: 0.4 });
  k.pendant(g, 0, 3.3, -0.6, F.T + 0.1);
  k.pendant(g, F.x0 + 1.4, 3.1, (F.door.lo + F.door.hi) / 2, F.T + 0.1, { intensity: 6, distance: 10 });
  return finish(w, h, 'nunatak-chamber-shell');
}

/* ======================================================================
   8. UNDER THE ERRATIC (site-8, q8-trends — Periodic Trends)
   A boulder the size of a house left on the west moraine by the glacier; a room of dry-stone walls under it, the
   boulder's underside its roof. The camp's metal stock and sample tiles in racks along the walls.
   ====================================================================== */

function buildErratic(w) {
  const h = begin(w, 7, 'erratic-store');
  const { F, g, k, b } = h;
  const M = w.M;
  const r = rng(808);
  const cx = (F.x0 + F.x1) / 2, cz = (F.z0 + F.z1) / 2;
  floorSlab(b, 'rockFloor', F);
  // Dry-stone walls: courses of stones laid without mortar, each course offset from the one below, up into the boulder.
  const WTOP = F.T + 0.6;
  for (const side of SIDES) {
    const { n } = sideLine(F, side);
    for (let y = 0, row = 0; y < WTOP - 0.05; row++) {
      const hh = Math.min(0.32 + r() * 0.12, WTOP - y);
      const sp = spans(F, side, y + 0.01);
      const along = Math.abs(sp.ux) > 0.5;
      lay(sp.list, () => 0.5 + r() * 0.5, (s0, s1) => {
        const mid = (s0 + s1) / 2;
        const x = sp.a[0] + sp.ux * mid - n[0] * WALL_T / 2, z = sp.a[1] + sp.uz * mid - n[1] * WALL_T / 2;
        const t = WALL_T - 0.06 * r();
        b.box('stone', along ? [s1 - s0 - 0.03, hh - 0.02, t] : [t, hh - 0.02, s1 - s0 - 0.03], [x - n[0] * (WALL_T - t) / 2, y + hh / 2, z - n[1] * (WALL_T - t) / 2], [0, (r() - 0.5) * 0.03, 0]);
      }, (row % 2) * 0.3);
      y += hh;
    }
    for (const d of doorsOn(F, side)) {
      const mid = (d.lo + d.hi) / 2;
      const along = side === 'front' || side === 'back';
      const c = along ? [mid, side === 'front' ? F.z1 + WALL_T / 2 : F.z0 - WALL_T / 2] : [side === 'left' ? F.x0 - WALL_T / 2 : F.x1 + WALL_T / 2, mid];
      b.box('stone', along ? [d.hi - d.lo + 1.2, 0.5, WALL_T + 0.1] : [WALL_T + 0.1, 0.5, d.hi - d.lo + 1.2], [c[0], d.top + 0.25, c[1]]);
    }
  }
  // THE BOULDER: a lump of granite resting on the walls. Its underside is a broad face no lower than the roof; its top
  // is rounded and split by the frost.
  const geo = new THREE.IcosahedronGeometry(1, 4);
  const p = geo.attributes.position;
  const SX = (F.x1 - F.x0) / 2 + 1.6, SY = 4.6, SZ = (F.z1 - F.z0) / 2 + 1.0;
  const bcz = cz - 0.8;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = 0.86 + 0.24 * fbm2(x * 1.6 + 7, z * 1.6 + y, 85, 3) + 0.08 * ridge2(x * 3 + y, z * 3, 87, 2);
    const X = x * SX * n, Z = z * SZ * n;
    const rr = Math.min(1, Math.hypot(X / SX, Z / SZ));
    const under = F.T + 0.25 + 0.9 * (1 - rr) + 0.2 * fbm2(X * 0.4, Z * 0.4, 89, 2);
    const Y = y < 0 ? under : F.T + 0.45 + y * SY * n;
    p.setXYZ(i, X + cx, Y, Z + bcz);
  }
  geo.computeVertexNormals();
  b.add('granite', geo);
  // The camp's metal stock: bars in a rack on the left, ingots on pallets on the right, sample tiles in drawers at the back.
  k.rack(g, F.x0 + 0.7, 3.2, 5.6, 0.8, 1.6, 3, false, y => {
    for (let i = 0; i < 7; i++) k.box(g, [0.08, 0.08, 4.8], i % 2 ? M.steel : M.darkSteel, [F.x0 + 0.45 + i * 0.08, y + 0.05, 3.2]);
  });
  for (let i = 0; i < 3; i++) {
    k.box(g, [1.1, 0.14, 1.1], M.timber, [F.x1 - 1.0, 0.07, 1.0 + i * 1.6]);
    for (let j = 0; j < 4; j++) k.box(g, [0.45, 0.14, 0.2], j % 2 ? M.case : M.steel, [F.x1 - 1.0 + (j % 2 ? 0.25 : -0.25), 0.21 + Math.floor(j / 2) * 0.15, 1.0 + i * 1.6]);
  }
  for (const x of [-4.4, 4.4]) {
    k.box(g, [2.6, 1.3, 0.7], M.darkSteel, [x, 0.65, F.z0 + 0.5], null, true);
    for (let row = 0; row < 3; row++) for (let c = 0; c < 4; c++) k.box(g, [0.55, 0.3, 0.02], M.steel, [x - 0.96 + c * 0.64, 0.28 + row * 0.4, F.z0 + 0.86]);
  }
  h.colliders.push({ lx: F.x0 + 0.7, lz: 3.2, hw: 0.5, hd: 2.9 }, { lx: F.x1 - 1.0, lz: 2.6, hw: 0.6, hd: 2.4 },
    { lx: -4.4, lz: F.z0 + 0.5, hw: 1.35, hd: 0.4 }, { lx: 4.4, lz: F.z0 + 0.5, hw: 1.35, hd: 0.4 });
  k.pendant(g, 0, 3.3, -0.6, F.T + 0.2);
  k.pendant(g, 0, 3.2, F.z1 - 1.6, F.T + 0.2, { intensity: 6, distance: 10 });
  return finish(w, h, 'erratic-store-shell');
}

/* ======================================================================
   9. THE ICE-HOLE CAVE (site-9, q9-absorb — Spectroscopy)
   A cave under the west shore's pressure ridge on the lake ice: slabs stacked in courses that step inward into a
   rough vault. A hole cut through the floor to the water, its tripod and winch, and the sealed tank by the plate.
   ====================================================================== */

function buildHoleCave(w) {
  const h = begin(w, 8, 'hole-cave');
  const { F, g, k, b } = h;
  const M = w.M;
  const r = rng(909);
  floorSlab(b, 'slab', F);
  // Corbelled courses of slabs: upright to 2.6 m, then each course stepping 0.4 m inward, capped above.
  const COURSE = 0.6;
  for (const side of SIDES) {
    const { n } = sideLine(F, side);
    for (let y = 0, row = 0; y < F.T; row++) {
      const step = y < 2.6 ? 0 : (Math.floor((y - 2.6) / COURSE) + 1) * 0.4;
      const sp = spans(F, side, y + 0.01, WALL_T + step);
      const along = Math.abs(sp.ux) > 0.5;
      lay(sp.list, () => 1.2 + r() * 0.8, (s0, s1) => {
        const mid = (s0 + s1) / 2;
        const x = sp.a[0] + sp.ux * mid + n[0] * (step - WALL_T / 2), z = sp.a[1] + sp.uz * mid + n[1] * (step - WALL_T / 2);
        b.box('slab', along ? [s1 - s0 + 0.05, COURSE - 0.03, WALL_T] : [WALL_T, COURSE - 0.03, s1 - s0 + 0.05], [x, y + COURSE / 2, z], [(r() - 0.5) * 0.04, 0, (r() - 0.5) * 0.04]);
      }, (row % 2) * 0.5);
      y += COURSE;
    }
    for (const d of doorsOn(F, side)) {
      const mid = (d.lo + d.hi) / 2;
      const [x, z] = side === 'left' ? [F.x0 - WALL_T / 2, mid] : side === 'right' ? [F.x1 + WALL_T / 2, mid] : [mid, side === 'front' ? F.z1 + WALL_T / 2 : F.z0 - WALL_T / 2];
      b.box('slab', side === 'left' || side === 'right' ? [WALL_T + 0.2, 0.6, d.hi - d.lo + 1.4] : [d.hi - d.lo + 1.4, 0.6, WALL_T + 0.2], [x, d.top + 0.3, z]);
    }
  }
  // The cap: slabs laid over what the courses leave open.
  for (let i = 0; i < 6; i++) {
    b.box('slab', [F.x1 - F.x0 - 1.4, 0.5, 2.2], [(F.x0 + F.x1) / 2, F.T + 0.25, F.z0 + 1.4 + i * ((F.z1 - F.z0 - 2.8) / 5)], [(r() - 0.5) * 0.08, (r() - 0.5) * 0.1, 0]);
  }
  // The ridge heaped over it, and snow drifted on the slabs.
  for (let i = 0; i < 22; i++) {
    const side = SIDES[i % 4];
    if (side === F.door.side) continue;
    const { a, b: e, n } = sideLine(F, side);
    const t = r();
    b.box('slab', [1.6 + r() * 1.6, 0.4, 1.2 + r()], [a[0] + (e[0] - a[0]) * t - n[0] * (1.7 + r()), 0.4 + r() * 2.0, a[1] + (e[1] - a[1]) * t - n[1] * (1.7 + r())], [0.5 + r() * 0.7, r() * 3, (r() - 0.5) * 0.5]);
  }
  // THE HOLE through the floor's ice to the water, its broken rim, the tripod over it and its winch.
  const hx = -4.4, hz = 2.4;
  k.cyl(g, [0.7, 0.7, 0.02, 24], M.water, [hx, 0.012, hz]);
  for (let i = 0; i < 9; i++) {
    const t = (i / 9) * Math.PI * 2;
    k.box(g, [0.36, 0.12, 0.2], M.carved, [hx + Math.cos(t) * 0.9, 0.06, hz + Math.sin(t) * 0.9], [0, -t, 0]);
  }
  for (let i = 0; i < 3; i++) {
    const t = (i / 3) * Math.PI * 2 + 0.3;
    k.strut(g, [hx + Math.cos(t) * 1.15, 0, hz + Math.sin(t) * 1.15], [hx, 2.9, hz], 0.045, M.timber);
  }
  k.box(g, [0.3, 0.3, 0.3], M.darkSteel, [hx, 2.85, hz]);
  k.cyl(g, [0.006, 0.006, 2.8, 4], M.darkSteel, [hx, 1.45, hz]);
  k.cyl(g, [0.12, 0.12, 0.5, 10], M.steel, [hx - 0.9, 1.0, hz - 0.9], [0, 0, Math.PI / 2]);
  // The sealed tank on the plate's right, the sampling bottles in their crate.
  k.cyl(g, [0.55, 0.55, 1.5, 18], M.steel, [3.4, 0.75, -1.0], null, true);
  for (const y of [0.3, 1.2]) k.cyl(g, [0.57, 0.57, 0.06, 18], M.darkSteel, [3.4, y, -1.0]);
  k.box(g, [0.8, 0.4, 0.5], M.timber, [F.x1 - 0.8, 0.2, F.z0 + 0.8]);
  for (let i = 0; i < 6; i++) k.cyl(g, [0.05, 0.05, 0.22, 8], M.glass, [F.x1 - 1.05 + (i % 3) * 0.25, 0.51, F.z0 + 0.7 + Math.floor(i / 3) * 0.2]);
  h.colliders.push({ lx: hx, lz: hz, r: 1.35 }, { lx: 3.4, lz: -1.0, r: 0.65 }, { lx: F.x1 - 0.8, lz: F.z0 + 0.8, hw: 0.5, hd: 0.35 });
  k.pendant(g, 0, 3.3, -0.6, F.T);
  k.pendant(g, F.x0 + 1.6, 3.1, (F.door.lo + F.door.hi) / 2, F.T, { intensity: 6, distance: 10 });
  return finish(w, h, 'hole-cave-shell');
}

/* ======================================================================
   10. THE DOME (site-10, q10-wavefunctions — Wavefunctions)
   The observatory's geodesic dome on the south-west knoll, on a square timber platform, entered through a porch.
   ====================================================================== */

function buildDome(w) {
  const h = begin(w, 9, 'observatory');
  const { F, g, k, b } = h;
  const M = w.M;
  const [ox, oz] = F.toHost(DOME.x, DOME.z);
  const R = DOME.r;
  const d = F.door;
  const porch = d.rect;
  // The platform: a square of timber decking the dome stands on, flush with the knoll.
  b.box('timber', [R * 2, 0.3, R * 2], [ox, -0.15, oz]);
  for (const r of [porch]) b.box('timber', [r.x1 - r.x0, 0.3, r.z1 - r.z0], [(r.x0 + r.x1) / 2, -0.15, (r.z0 + r.z1) / 2]);
  // The dome: a geodesic sphere's upper half, struts on its edges and a panel in each face. The porch is cut through it.
  const ico = new THREE.IcosahedronGeometry(R, 2);
  const pp = ico.attributes.position;
  const inPorch = (x, y, z) => x > porch.x0 - 0.1 && x < porch.x1 + 0.1 && z > porch.z0 - 0.4 && y < d.top + 0.4;
  const edges = new Set();
  const panels = [];
  for (let t = 0; t < pp.count; t += 3) {
    const v = [0, 1, 2].map(i => [pp.getX(t + i), pp.getY(t + i), pp.getZ(t + i)]);
    const cy = (v[0][1] + v[1][1] + v[2][1]) / 3;
    if (cy < 0.2) continue;
    const c = [(v[0][0] + v[1][0] + v[2][0]) / 3 + ox, cy, (v[0][2] + v[1][2] + v[2][2]) / 3 + oz];
    if (inPorch(...c)) continue;
    panels.push(v);
    for (let i = 0; i < 3; i++) {
      const a = v[i], e = v[(i + 1) % 3];
      const key = [a, e].map(p => p.map(n => n.toFixed(2)).join(',')).sort().join('|');
      if (edges.has(key)) continue;
      edges.add(key);
      b.rod('darkSteel', [a[0] + ox, Math.max(0, a[1]), a[2] + oz], [e[0] + ox, Math.max(0, e[1]), e[2] + oz], 0.05, 5);
    }
  }
  const pos = [];
  for (const v of panels) for (const p of v) pos.push(p[0] * 0.995 + ox, Math.max(0, p[1]) * 0.995, p[2] * 0.995 + oz);
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  pg.computeVertexNormals();
  b.add('panel', pg);
  // The ring wall at the dome's foot (a low upstand the panels bolt to).
  for (let i = 0; i < 40; i++) {
    const t0 = (i / 40) * Math.PI * 2, t1 = ((i + 1) / 40) * Math.PI * 2;
    const a = [ox + Math.cos(t0) * R, oz + Math.sin(t0) * R], e = [ox + Math.cos(t1) * R, oz + Math.sin(t1) * R];
    const m = [(a[0] + e[0]) / 2, (a[1] + e[1]) / 2];
    if (m[0] > porch.x0 - 0.1 && m[0] < porch.x1 + 0.1 && m[1] > porch.z0 - 0.4) continue;
    b.beam('clad', [a[0], 0.45, a[1]], [e[0], 0.45, e[1]], 0.25, 0.9);
  }
  // The porch: two walls, a roof, the inner and outer door frames.
  const pw = porch.x1 - porch.x0, pd = porch.z1 - porch.z0, pcx = (porch.x0 + porch.x1) / 2, pcz = (porch.z0 + porch.z1) / 2;
  for (const s of [-1, 1]) b.box('clad', [0.2, d.top + 0.3, pd + 0.4], [pcx + s * (pw / 2 + 0.1), (d.top + 0.3) / 2, pcz]);
  b.box('clad', [pw + 0.6, 0.25, pd + 0.6], [pcx, d.top + 0.42, pcz]);
  for (const zz of [porch.z0 + 0.1, porch.z1 - 0.1]) b.box('darkSteel', [pw + 0.4, 0.2, 0.2], [pcx, d.top + 0.1, zz]);

  // THE RESONANCE RIG behind the plate: a drum on a frame with its drive, and the standing-wave string across it.
  const rz = F.z0 + 1.1;
  for (const x of [-2.4, 2.4]) k.box(g, [0.14, 2.4, 0.14], M.darkSteel, [x, 1.2, rz], null, true);
  k.box(g, [5.0, 0.14, 0.14], M.darkSteel, [0, 2.4, rz]);
  k.cyl(g, [0.9, 0.9, 0.18, 32], M.steel, [0, 1.3, rz], [Math.PI / 2, 0, 0]);
  k.cyl(g, [0.82, 0.82, 0.02, 32], M.paper, [0, 1.3, rz + 0.1], [Math.PI / 2, 0, 0]);
  k.cyl(g, [0.008, 0.008, 4.6, 4], M.steel, [0, 2.0, rz + 0.12], [0, 0, Math.PI / 2]);
  k.box(g, [0.5, 0.5, 0.5], M.caseDark, [-1.6, 0.25, rz]);
  // Cabinets round the ring between the floor and the dome's foot.
  for (const [x, z, rot] of [[-7.7, oz - 1.2, 0], [-7.7, oz + 1.2, 0], [7.7, oz - 1.2, 0], [7.7, oz + 1.2, 0], [-2.0, F.z0 - 1.6, Math.PI / 2], [2.0, F.z0 - 1.6, Math.PI / 2]]) {
    k.box(g, [0.7, 1.7, 1.6], M.caseDark, [ox + x, 0.85, z], [0, rot, 0], true);
  }
  h.colliders.push({ lx: 0, lz: rz, hw: 2.6, hd: 0.35 });
  k.pendant(g, 0, 2.55, -0.6, 4.6, { intensity: 16, distance: 14 });
  k.strut(g, [0, 4.6, -0.6], [0, Math.sqrt(R * R - (ox) ** 2 - (-0.6 - oz) ** 2) - 0.05, -0.6], 0.02, M.darkSteel);
  k.pendant(g, 0, 3.2, F.z1 - 1.5, d.top + 1.4, { intensity: 6, distance: 10 });
  k.strut(g, [0, d.top + 1.4, F.z1 - 1.5], [0, Math.sqrt(Math.max(0.1, R * R - (F.z1 - 1.5 - oz) ** 2)) - 0.05, F.z1 - 1.5], 0.02, M.darkSteel);
  return finish(w, h, 'observatory-shell');
}

/** site id -> builder(world, plan). */
export const HOST_BUILDERS = {
  'site-1': w => buildFlumeCave(w),
  'site-2': (w, plan) => buildMastVault(w, plan),
  'site-3': (w, plan) => buildMeltCave(w, plan),
  'site-4': w => buildDrillHall(w),
  'site-5': (w, plan) => buildRecordsTent(w, plan),
  'site-6': w => buildRecordsAnnexe(w),
  'site-7': (w, plan) => buildNunatakChamber(w, plan),
  'site-8': w => buildErratic(w),
  'site-9': w => buildHoleCave(w),
  'site-10': w => buildDome(w)
};
