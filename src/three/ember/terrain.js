/**
 * ember/terrain.js — Ember Reach's caldera wall, switchback terraces, room shells, lake and cone.
 *
 * ONE HEIGHT FUNCTION (`caldera-plan.js` `plan.height(x, z)`), ONE TERRAIN MESH to the horizon (±900 m).
 * Grid lines are snapped onto every walk-volume and room boundary so terrace edges and room cutouts
 * are clean without jagged triangles. Roofed rooms and their doorway passages are cut out of the terrain
 * mesh and built as crisp architectural shells (`phys: 'ground'`, merged per material) — seven distinct
 * room architectures (`ribs`, `sinterArch`, `brickVault`, `overhang`, `gantry`, `baffle`, `turbineHall`),
 * plus retaining walls along every cliff step and open 1.05 m steel railings along every lake-facing drop.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { fbm2, WALL_T } from './caldera-plan.js';

export { fbm2 };

const smooth = (a, b, t) => {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/* ======================================================================
   GRID AXES — fine across the caldera wall, exact on every volume edge
   ====================================================================== */

function mergeLines(base, extras, eps = 0.08) {
  const all = [...base, ...extras].sort((a, b) => a - b);
  const out = [];
  for (const v of all) {
    if (!out.length || v - out[out.length - 1] > eps) out.push(v);
  }
  return out;
}

/**
 * Grid lines along one axis: `step` apart out to `core`, then each `growth` times the last out to `reach`, plus every
 * snap. `bands` ([min, max, step]) add evenly spaced lines over a far landform that needs the resolution (the cone):
 * the realism pass lowered the growth from 1.24 and added the cone's band, so the caldera walls and the cone carry
 * their ledges, flows and gullies instead of reading as smooth sheets at 30–60 m cells.
 */
function axisLines(core = 104, step = 4, reach = 900, snaps = [], { growth = 1.24, bands = [] } = {}) {
  const pos = [];
  for (let v = 0; v <= core; v += step) pos.push(v);
  let v = core, s = step;
  while (v < reach) { s *= growth; v = Math.min(reach, v + s); pos.push(v); }
  const base = [...pos.slice(1).reverse().map(p => -p), ...pos];
  const extra = [];
  for (const [a, b, st] of bands) for (let x = a; x <= b; x += st) extra.push(x);
  return mergeLines(mergeLines(base, extra, st0(bands)), snaps, 0.12);
}
const st0 = bands => Math.min(2, ...bands.map(b => b[2] * 0.45));

/* ======================================================================
   VERTEX COLOURING — volcanic basalt, banded tuff, cinder road, sulphur
   ====================================================================== */

const C = {
  sinter: [0.92, 0.89, 0.82],
  cinder: [0.28, 0.25, 0.24],
  basalt: [0.23, 0.21, 0.21],
  flow: [0.14, 0.13, 0.135],
  tuffA: [0.58, 0.46, 0.36],
  tuffB: [0.40, 0.34, 0.30],
  tuffC: [0.70, 0.56, 0.42],
  scoria: [0.42, 0.23, 0.17],
  sulphur: [0.98, 0.86, 0.38],
  ochre: [0.88, 0.62, 0.38]
};

function groundTint(x, z, y, slope, plan, data, marks) {
  const inWalk = Boolean(plan.volumeAt(x, z));
  let c;

  if (inWalk) {
    // Compacted dark cinder haul road with subtle wheel-track darkening and dusty sinter shoulders.
    const n = fbm2(x * 0.09, z * 0.09, 31, 2);
    const track = 0.5 + 0.5 * Math.cos(z * 1.45 + x * 0.12);
    c = mix3(C.cinder, C.tuffB, n * 0.28 + track * 0.14);
  } else if (z < -76) {
    // Caldera floor: dark cooled basalt flow, reddening toward the lava lake and cone.
    const n = fbm2(x * 0.04, z * 0.04, 83, 3);
    c = mix3(C.flow, C.basalt, n);
    const L = data.lake;
    const le = ((x - L.x) / L.rx) ** 2 + ((z - L.z) / L.rz) ** 2;
    if (le < 2.2) c = mix3(c, C.scoria, (1 - smooth(0.85, 2.2, le)) * 0.65);
    const Co = data.cone;
    const rc = Math.hypot(x - Co.x, z - Co.z);
    if (rc < Co.radius) c = mix3(c, C.scoria, (1 - smooth(Co.radius * 0.2, Co.radius, rc)) * 0.45);
  } else {
    // Stepped caldera wall and outer amphitheatre: stratified basalt flows and ochre tuff bands in section.
    const strata = Math.sin(y * 0.42 + fbm2(x * 0.018, z * 0.018, 89, 2) * 3.0);
    const tuff = strata > 0.15 ? mix3(C.tuffB, C.tuffA, strata) : mix3(C.tuffB, C.basalt, Math.min(1, -strata * 0.9 + 0.15));
    const cap = mix3(C.sinter, C.tuffC, fbm2(x * 0.03, z * 0.03, 97, 2));
    c = mix3(cap, tuff, smooth(0.06, 0.34, slope));
    // Lower cliff ledges dusted with warm ochre fume.
    if (y > -18 && y < 22) {
      c = mix3(c, C.ochre, smooth(22, -6, y) * (1 - smooth(0.15, 0.55, slope)) * 0.24);
    }
  }

  // Vent field mineral marks (sulphur round fumaroles).
  for (const mk of marks) {
    const d = Math.hypot(x - mk.x, z - mk.z);
    if (d < mk.r) {
      const t = (1 - smooth(mk.r * 0.2, mk.r, d)) * mk.w;
      c = mix3(c, mk.col, t);
    }
  }

  const grain = 0.92 + fbm2(x * 0.14, z * 0.14, 101, 2) * 0.16;
  return [c[0] * grain, c[1] * grain, c[2] * grain];
}

/* ======================================================================
   TERRAIN MESH (with exact cutouts over roofed rooms)
   ====================================================================== */

export function buildEmberTerrainGeometry(plan, data) {
  const holes = plan.roomHoles();
  const snapX = [], snapZ = [];
  for (const v of plan.volumes) {
    snapX.push(v.rect.minX, v.rect.maxX);
    snapZ.push(v.rect.minZ, v.rect.maxZ);
  }
  for (const h of holes) {
    snapX.push(h.minX, h.maxX);
    snapZ.push(h.minZ, h.maxZ);
  }
  const cone = data.cone;
  const xs = axisLines(104, 4, 900, snapX, { growth: 1.13, bands: [[cone.x - cone.radius - 10, cone.x + cone.radius + 10, 6]] });
  const zs = axisLines(104, 4, 900, snapZ, { growth: 1.13, bands: [[cone.z - cone.radius - 10, cone.z + cone.radius + 10, 6]] });
  const nx = xs.length, nz = zs.length;

  const marks = [];
  for (const lm of data.landmarks || []) {
    if (lm.asset === 'fumarole' || lm.asset === 'sulfur-mound') {
      marks.push({ x: lm.pos[0], z: lm.pos[2], r: 4.5, col: C.sulphur, w: 0.72 });
    }
  }

  // A gallery buried in the cliff (`caldera-plan.js` `bankGalleries`) is not cut out: the ground runs on over its roof
  // at the banked height. Only the cell in front of its facade over the doorway stays open, so the portal shows.
  const buried = plan.buriedRooms ? plan.buriedRooms() : [];
  const inBuried = (x, z) => buried.find(g => x >= g.rect.minX - 0.2 && x <= g.rect.maxX + 0.2 &&
    z >= g.rect.minZ - 0.2 && z <= g.rect.maxZ + 0.2);
  const inHoleRaw = (x, z) => holes.some(h => x > h.minX && x < h.maxX && z > h.minZ && z < h.maxZ);
  const inHole = (x, z) => inHoleRaw(x, z) && !inBuried(x, z);
  const onHoleRim = (x, z) => holes.some(h =>
    x >= h.minX - 0.15 && x <= h.maxX + 0.15 && z >= h.minZ - 0.15 && z <= h.maxZ + 0.15 && !inHole(x, z)
  );

  const pos = new Float32Array(nx * nz * 3);
  const uv = new Float32Array(nx * nz * 2);
  const col = new Float32Array(nx * nz * 3);

  for (let j = 0; j < nz; j++) {
    const z = zs[j];
    for (let i = 0; i < nx; i++) {
      const x = xs[i];
      // Vertices right on a room cutout rim take landHeight so cliffs seal cleanly over the gallery roof.
      const y = inBuried(x, z) || (onHoleRim(x, z) && !plan.volumeAt(x, z)) ? plan.landHeight(x, z) : plan.height(x, z);
      const k = j * nx + i;
      pos[k * 3] = x;
      pos[k * 3 + 1] = y;
      pos[k * 3 + 2] = z;
      uv[k * 2] = x * 0.08;
      uv[k * 2 + 1] = z * 0.08;
    }
  }

  const idx = [];
  for (let j = 0; j < nz - 1; j++) {
    const zc = (zs[j] + zs[j + 1]) * 0.5;
    for (let i = 0; i < nx - 1; i++) {
      const xc = (xs[i] + xs[i + 1]) * 0.5;
      if (inHole(xc, zc)) continue;
      const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();

  const norm = geo.attributes.normal;
  for (let j = 0; j < nz; j++) {
    const z = zs[j];
    for (let i = 0; i < nx; i++) {
      const x = xs[i];
      const k = j * nx + i;
      const y = pos[k * 3 + 1];
      const slope = 1 - Math.max(0, norm.getY(k));
      const [r, g, b] = groundTint(x, z, y, slope, plan, data, marks);
      col[k * 3] = r; col[k * 3 + 1] = g; col[k * 3 + 2] = b;
    }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

/* ======================================================================
   LAVA LAKE ELLIPSE
   ====================================================================== */

export function buildLakeGeometry(lake) {
  const geo = new THREE.CircleGeometry(1, 56);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) * lake.rx;
    const z = p.getZ(i) * lake.rz;
    p.setXYZ(i, x, 0, z);
    uv.setXY(i, x * 0.032, z * 0.032);
  }
  geo.computeVertexNormals();
  return geo;
}

/* ======================================================================
   CALDERA ARCHITECTURAL SHELLS (rooms, retaining walls, kerbs, railings)
   All tagged `phys: 'ground'` and merged by material for minimal draw calls.
   ====================================================================== */

/**
 * Arris radius (m) per shell material (realism pass): poured concrete and laid brick have a chamfered or worn edge,
 * never a knife edge. Rounded inside the box's own bounds, so nothing grows.
 */
const ROUND = { concrete: 0.035, brick: 0.02, floorSlab: 0.02 };

function boxGeo(matKey, sx, sy, sz) {
  const r = ROUND[matKey];
  if (r && Math.min(sx, sy, sz) > r * 4) return new RoundedBoxGeometry(sx, sy, sz, 2, r);
  return new THREE.BoxGeometry(sx, sy, sz);
}

function addBox(buckets, matKey, sx, sy, sz, x, y, z, rx = 0, ry = 0, rz = 0) {
  if (matKey === 'rock') return addRockBox(buckets, sx, sy, sz, x, y, z, rx, ry, rz);
  const g = boxGeo(matKey, sx, sy, sz);
  if (rx || ry || rz) g.rotateX(rx).rotateY(ry).rotateZ(rz);
  g.translate(x, y, z);
  let arr = buckets.get(matKey);
  if (!arr) { arr = []; buckets.set(matKey, arr); }
  arr.push(g);
}

function addCyl(buckets, matKey, rt, rb, h, seg, x, y, z, rx = 0, ry = 0, rz = 0) {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg);
  if (rx || ry || rz) g.rotateX(rx).rotateY(ry).rotateZ(rz);
  g.translate(x, y, z);
  let arr = buckets.get(matKey);
  if (!arr) { arr = []; buckets.set(matKey, arr); }
  arr.push(g);
}

/** Add a sloped or horizontal beam between 3D points A and B. */
function addBeam(buckets, matKey, a, b, w, h) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const dir = vb.clone().sub(va);
  const len = dir.length();
  if (len < 0.01) return;
  const g = boxGeo(matKey, w, h, len);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.normalize());
  g.applyQuaternion(q);
  const mid = va.add(vb).multiplyScalar(0.5);
  g.translate(mid.x, mid.y, mid.z);
  let arr = buckets.get(matKey);
  if (!arr) { arr = []; buckets.set(matKey, arr); }
  arr.push(g);
}

/**
 * A rock-cut face (realism pass): a box subdivided at ~0.45 m whose every face is pushed INWARD by seeded noise, so a
 * gallery wall, pier or soffit reads as hewn rock, not a sawn block. The push tapers to nothing at each face's edges
 * (no cracks open at the corners) and never exceeds 45% of the half-thickness, so the body stays inside its old box.
 */
function addRockBox(buckets, sx, sy, sz, x, y, z, rx = 0, ry = 0, rz = 0) {
  const seg = v => Math.max(1, Math.min(36, Math.ceil(v / 0.45)));
  const g = new THREE.BoxGeometry(sx, sy, sz, seg(sx), seg(sy), seg(sz));
  const half = [sx / 2, sy / 2, sz / 2];
  const pos = g.attributes.position, nor = g.attributes.normal;
  const p = [0, 0, 0], n = [0, 0, 0];
  for (let i = 0; i < pos.count; i++) {
    p[0] = pos.getX(i); p[1] = pos.getY(i); p[2] = pos.getZ(i);
    n[0] = nor.getX(i); n[1] = nor.getY(i); n[2] = nor.getZ(i);
    const a = Math.abs(n[0]) > 0.5 ? 0 : Math.abs(n[1]) > 0.5 ? 1 : 2;
    const b = (a + 1) % 3, c = (a + 2) % 3;
    const edge = Math.min(half[b] - Math.abs(p[b]), half[c] - Math.abs(p[c]));
    const taper = smooth(0, 0.4, edge);
    const wx = x + p[0], wy = y + p[1], wz = z + p[2];
    const k = fbm2(wx * 0.55 + wz * 0.41, wy * 0.6 - wz * 0.23, 113, 3) * 0.75 + fbm2(wx * 2.1 - wz * 1.3, wy * 2.3, 127, 2) * 0.25;
    const amt = Math.min(half[a] * 0.45, (0.02 + 0.16 * k * k) * taper);
    p[a] -= Math.sign(n[a]) * amt;
    pos.setXYZ(i, p[0], p[1], p[2]);
  }
  g.computeVertexNormals();
  if (rx || ry || rz) g.rotateX(rx).rotateY(ry).rotateZ(rz);
  g.translate(x, y, z);
  let arr = buckets.get('rock');
  if (!arr) { arr = []; buckets.set('rock', arr); }
  arr.push(g);
}

/** A round tube between 3D points A and B (rail, post): what safety rail is made of, not square bar. */
function addTube(buckets, matKey, a, b, radius, seg = 10) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const dir = vb.clone().sub(va);
  const len = dir.length();
  if (len < 0.01) return;
  const g = new THREE.CylinderGeometry(radius, radius, len, seg, 1, false);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
  const mid = va.add(vb).multiplyScalar(0.5);
  g.translate(mid.x, mid.y, mid.z);
  let arr = buckets.get(matKey);
  if (!arr) { arr = []; buckets.set(matKey, arr); }
  arr.push(g);
}

/**
 * The shells' own materials (`ember.js` `initMaterials`): the same surfaces laid in world metres, which the
 * photographed packs replace at T4. A bucket not named here keeps the shared material.
 */
const SHELL_MAT = {
  concrete: 'shellConcrete', rock: 'shellRock', brick: 'shellBrick', hallWall: 'shellSheet', hallRoof: 'shellRoof',
  roofSheet: 'shellRoof', sinterWarm: 'shellSinter', darkSteel: 'shellSteel', rusted: 'shellRusted',
  floorSlab: 'shellFloor'
};

/**
 * Build every room's floor, walls, architectural ceiling/roof, retaining walls along cliff steps,
 * road kerbs, and open 1.05 m steel railings along every lake-facing drop.
 * Returns a `THREE.Group` with `userData.phys = 'ground'`.
 */
export function buildCalderaShells(ctx, plan) {
  const group = new THREE.Group();
  group.name = 'ember-shells';
  group.userData.phys = 'ground';
  group.userData.noWeather = true;

  const buckets = new Map();
  // Galleries the cliff is banked over (`caldera-plan.js` `bankGalleries`): their roof stops flush with the facade.
  const buriedIds = new Set((plan.buriedRooms ? plan.buriedRooms() : []).map(g => g.id));

  /* 1. THE SEVEN ROOMS — each with its own shell architecture */
  for (const v of plan.volumes) {
    if (v.kind !== 'room') continue;
    const rm = v.room;
    const r = rm.rect;
    const y0 = rm.floor;
    const top = rm.top;
    const cx = (r.minX + r.maxX) / 2;
    const cz = (r.minZ + r.maxZ) / 2;
    const W = r.maxX - r.minX;
    const D = r.maxZ - r.minZ;
    // The roof slab: 0.7 m proud of the walls all round, except at a buried gallery's front, where the ground over
    // the roof meets the facade and an eave would stick out of the cliff like a lid.
    const roofFront = buriedIds.has(v.id) ? r.minZ - WALL_T : r.minZ - 0.7;
    const roof = (key, wExtra, h, yc) => {
      const z0 = roofFront, z1 = r.maxZ + 0.7;
      addBox(buckets, key, W + wExtra, h, z1 - z0, cx, yc, (z0 + z1) / 2);
    };

    // Floor slab (covers the room cutout cleanly, flush with y0).
    addBox(buckets, 'floorSlab', W + 0.8, 0.4, D + 0.8, cx, y0 - 0.2, cz);

    // Doorway threshold floor slab (bridges z from road to room).
    const [d0, d1] = rm.door;
    addBox(buckets, 'floorSlab', (d1 - d0) + 0.6, 0.4, WALL_T + 0.6, (d0 + d1) / 2, y0 - 0.2, r.minZ - WALL_T / 2);

    // Choose wall material per room architecture.
    const wallMat = rm.shell === 'brickVault' ? 'brick'
      : rm.shell === 'turbineHall' ? 'hallWall'
      : rm.shell === 'gantry' || rm.shell === 'baffle' ? 'concrete'
      : rm.shell === 'sinterArch' ? 'sinterWarm'
      : 'rock';

    // Solid perimeter wall segments from `workings.js` (auto-omits doorway and open bay).
    const wallH = rm.shell === 'turbineHall' ? top + 0.4 : top + 0.45;
    for (const seg of plan.wallSegments(v)) {
      const len = Math.hypot(seg.bx - seg.ax, seg.bz - seg.az);
      const mx = (seg.ax + seg.bx) / 2;
      const mz = (seg.az + seg.bz) / 2;
      const thick = WALL_T;
      // The turbine hall's sheet stands on a 0.6 m poured upstand, as clad halls do (sheet never meets the ground).
      const base = wallMat === 'hallWall' ? 0.6 : 0;
      if (seg.side === 'minX' || seg.side === 'maxX') {
        const ox = seg.side === 'minX' ? -thick / 2 : thick / 2;
        if (base) addBox(buckets, 'concrete', thick, base, len + thick, mx + ox, y0 + base / 2, mz);
        addBox(buckets, wallMat, thick, wallH - base, len + thick, mx + ox, y0 + base + (wallH - base) / 2, mz);
      } else {
        const oz = seg.side === 'minZ' ? -thick / 2 : thick / 2;
        if (base) addBox(buckets, 'concrete', len + thick, base, thick, mx, y0 + base / 2, mz + oz);
        addBox(buckets, wallMat, len + thick, wallH - base, thick, mx, y0 + base + (wallH - base) / 2, mz + oz);
      }
    }

    // Lintels / headers over doorway and open viewing bay (always >= 4.7 m over floor to clear lean-in camera).
    const lintelBottom = Math.max(4.75, top - 0.55);
    const lintelH = Math.max(0.45, (y0 + top + 0.45) - (y0 + lintelBottom));
    addBox(buckets, wallMat, (d1 - d0) + 0.4, lintelH, WALL_T + 0.2, (d0 + d1) / 2, y0 + lintelBottom + lintelH / 2, r.minZ - WALL_T / 2);
    if (rm.bay) {
      const [b0, b1] = rm.bay;
      addBox(buckets, wallMat, (b1 - b0) + 0.4, lintelH, WALL_T + 0.2, (b0 + b1) / 2, y0 + lintelBottom + lintelH / 2, r.minZ - WALL_T / 2);
    }

    // Roof + distinct architectural ceiling per shell type (all structural ribs stay >= top - 0.35 >= 4.8 m).
    if (rm.shell === 'ribs') {
      // Room 1: Rock-cut gallery with rolled steel arch ribs and weathered corrugated roof overhead.
      roof('roofSheet', 1.4, 0.45, y0 + top + 0.225);
      for (let x = r.minX + 1.4; x <= r.maxX - 1.2; x += 2.8) {
        addBox(buckets, 'darkSteel', 0.28, top, 0.34, x, y0 + top / 2, r.maxZ - 0.18);
        addBox(buckets, 'darkSteel', 0.28, 0.32, D - 0.2, x, y0 + top - 0.16, cz);
      }
      // Rock piers framing the wide north portal.
      addBox(buckets, 'rock', 0.8, top, 1.0, d0 - 0.4, y0 + top / 2, r.minZ - 0.2);
      addBox(buckets, 'rock', 0.8, top, 1.0, d1 + 0.4, y0 + top / 2, r.minZ - 0.2);
    } else if (rm.shell === 'sinterArch') {
      // Room 2: Stepped sinter-crusted gallery with transverse concrete arches and open lake bay.
      roof('sinterWarm', 1.4, 0.45, y0 + top + 0.225);
      for (let z = r.minZ + 1.5; z <= r.maxZ - 1.2; z += 3.2) {
        addBox(buckets, 'concrete', W - 0.2, 0.32, 0.45, cx, y0 + top - 0.16, z);
      }
      // Steel stanchion dividing the 7.6 m lake-viewing bay.
      if (rm.bay) {
        const bm = (rm.bay[0] + rm.bay[1]) / 2;
        addBox(buckets, 'darkSteel', 0.24, top, 0.24, bm, y0 + top / 2, r.minZ - WALL_T / 2);
      }
    } else if (rm.shell === 'brickVault') {
      // Room 3: Refractory brick barrel vault (faceted 5-chord arch above y0 + top - 0.4).
      roof('roofSheet', 1.4, 0.8, y0 + top + 0.8);
      const segs = 5;
      for (let i = 0; i < segs; i++) {
        const a0 = Math.PI * (i / segs), a1 = Math.PI * ((i + 1) / segs);
        const am = (a0 + a1) / 2;
        const radX = W / 2, radY = 1.15;
        const x = cx - Math.cos(am) * radX * 0.86;
        const y = y0 + top - 0.45 + Math.sin(am) * radY;
        const chord = (W / segs) * 1.12;
        const tilt = Math.atan2(Math.sin(a1) * radY - Math.sin(a0) * radY, -(Math.cos(a1) - Math.cos(a0)) * radX);
        addBox(buckets, 'brick', chord, 0.35, D + 0.6, x, y, cz, 0, 0, tilt);
      }
      // Heavy brick portal piers.
      addBox(buckets, 'brick', 0.9, top, 0.9, d0 - 0.45, y0 + top / 2, r.minZ - 0.25);
      addBox(buckets, 'brick', 0.9, top, 0.9, d1 + 0.45, y0 + top / 2, r.minZ - 0.25);
    } else if (rm.shell === 'overhang') {
      // Room 4: Rough-hewn stepped basalt overhang with wide 8 m colonnade facing the caldera.
      roof('roofSheet', 1.6, 0.45, y0 + top + 0.225);
      // Stepped rock soffit ledges along the back and sides.
      addBox(buckets, 'rock', W - 0.4, 0.45, 2.2, cx, y0 + top - 0.22, r.maxZ - 1.1);
      addBox(buckets, 'rock', 1.6, 0.45, D - 0.4, r.minX + 0.8, y0 + top - 0.22, cz);
      addBox(buckets, 'rock', 1.6, 0.45, D - 0.4, r.maxX - 0.8, y0 + top - 0.22, cz);
      // Twin heavy steel H-columns framing the 8 m open north colonnade.
      addBox(buckets, 'rusted', 0.34, top, 0.34, d0 + 0.15, y0 + top / 2, r.minZ - WALL_T / 2);
      addBox(buckets, 'rusted', 0.34, top, 0.34, d1 - 0.15, y0 + top / 2, r.minZ - WALL_T / 2);
    } else if (rm.shell === 'gantry') {
      // Room 5: Concrete-and-truss pipe gallery with twin overhead steel gantry rails.
      roof('concrete', 1.4, 0.8, y0 + top + 0.4);
      for (const z of [r.minZ + 2.4, cz, r.maxZ - 2.4]) {
        addBox(buckets, 'steel', W - 0.3, 0.36, 0.22, cx, y0 + top - 0.2, z);
      }
      // Twin insulated overhead steam mains running high along the east and west walls.
      addCyl(buckets, 'clad', 0.26, 0.26, D - 0.4, 12, r.minX + 0.8, y0 + top - 0.65, cz, Math.PI / 2, 0, 0);
      addCyl(buckets, 'clad', 0.26, 0.26, D - 0.4, 12, r.maxX - 0.8, y0 + top - 0.65, cz, Math.PI / 2, 0, 0);
    } else if (rm.shell === 'baffle') {
      // Room 6: Acoustic concrete baffle alcove with deep ceiling baffles and open lake bay.
      roof('concrete', 1.4, 0.8, y0 + top + 0.4);
      for (let x = r.minX + 1.8; x <= r.maxX - 1.4; x += 2.2) {
        addBox(buckets, 'concrete', 0.24, 0.55, D - 0.4, x, y0 + top - 0.28, cz);
      }
      if (rm.bay) {
        const bm = (rm.bay[0] + rm.bay[1]) / 2;
        addBox(buckets, 'concrete', 0.45, top, 0.55, bm, y0 + top / 2, r.minZ - WALL_T / 2);
      }
    } else if (rm.shell === 'turbineHall') {
      // Room 7: Full gabled steel-truss industrial hall with ridge roof and clerestory band.
      const ridge = rm.ridge || 9.0;
      const halfD = (D + 1.2) / 2;
      const rise = ridge - top;
      const slopeLen = Math.hypot(halfD, rise);
      const pitch = Math.atan2(rise, halfD);
      // Two pitched corrugated roof planes meeting at the ridge.
      addBox(buckets, 'hallRoof', W + 1.6, 0.35, slopeLen, cx, y0 + top + rise / 2, cz - halfD / 2, -pitch, 0, 0);
      addBox(buckets, 'hallRoof', W + 1.6, 0.35, slopeLen, cx, y0 + top + rise / 2, cz + halfD / 2, pitch, 0, 0);
      // Gable end triangles approximated by stepped horizontal infill at east & west ends.
      for (const gx of [r.minX - WALL_T / 2, r.maxX + WALL_T / 2]) {
        addBox(buckets, 'hallWall', WALL_T, rise * 0.55, D * 0.65, gx, y0 + top + rise * 0.28, cz);
        addBox(buckets, 'hallWall', WALL_T, rise * 0.45, D * 0.32, gx, y0 + top + rise * 0.72, cz);
      }
      // Interior steel roof trusses & wall stanchions.
      for (let x = r.minX + 1.6; x <= r.maxX - 1.4; x += 3.2) {
        addBox(buckets, 'darkSteel', 0.24, top, 0.24, x, y0 + top / 2, r.maxZ - 0.16);
        addBox(buckets, 'darkSteel', 0.24, 0.28, D - 0.2, x, y0 + top - 0.14, cz);
        addBox(buckets, 'darkSteel', 0.18, rise - 0.2, 0.18, x, y0 + top + (rise - 0.2) / 2, cz);
      }
    }
  }

  /* 2. RETAINING WALLS & KERBS along the switchback roads and ramps */
  // Collect room wall bands so road retaining walls never overlap room facades (prevents z-fighting inside & out).
  const roomVols = plan.volumes.filter(v => v.kind === 'room');
  const overlapsRoomWall = (x0, x1, z0, z1) => roomVols.some(rv => {
    const r = rv.room.rect;
    return x1 > r.minX - WALL_T - 0.15 && x0 < r.maxX + WALL_T + 0.15 &&
           z1 > r.minZ - WALL_T - 0.15 && z0 < r.maxZ + WALL_T + 0.15;
  });

  for (const v of plan.openVols) {
    for (const seg of plan.wallSegments(v)) {
      const ya = plan.floorOf(v, seg.ax, seg.az);
      const yb = plan.floorOf(v, seg.bx, seg.bz);
      const len = Math.hypot(seg.bx - seg.ax, seg.bz - seg.az);
      const mx = (seg.ax + seg.bx) / 2;
      const mz = (seg.az + seg.bz) / 2;
      const my = (ya + yb) / 2;
      // Low concrete kerb + rock retaining face rising 1.4 m on the uphill / closed side.
      const h = 1.6;
      const ox = -seg.dirX * 0.34;
      const oz = -seg.dirZ * 0.34;
      if (Math.abs(ya - yb) < 0.05) {
        if (seg.side === 'minX' || seg.side === 'maxX') {
          const xMin = mx + ox - 0.3, xMax = mx + ox + 0.3;
          const zMin = mz - (len + 0.4) / 2, zMax = mz + (len + 0.4) / 2;
          if (!overlapsRoomWall(xMin, xMax, zMin, zMax)) {
            addBox(buckets, 'concrete', 0.6, h, len + 0.2, mx + ox, my + h / 2 - 0.3, mz);
          }
        } else {
          // Split along X to skip any span directly against a room's facade wall.
          const ax = Math.min(seg.ax, seg.bx), bx = Math.max(seg.ax, seg.bx);
          const zBand = mz + oz;
          let spans = [[ax, bx]];
          for (const rv of roomVols) {
            const r = rv.room.rect;
            if (zBand + 0.35 > r.minZ - WALL_T - 0.15 && zBand - 0.35 < r.maxZ + WALL_T + 0.15) {
              const cut0 = r.minX - WALL_T - 0.15, cut1 = r.maxX + WALL_T + 0.15;
              const next = [];
              for (const [s0, s1] of spans) {
                if (s1 <= cut0 || s0 >= cut1) { next.push([s0, s1]); continue; }
                if (s0 < cut0) next.push([s0, cut0]);
                if (s1 > cut1) next.push([cut1, s1]);
              }
              spans = next;
            }
          }
          for (const [s0, s1] of spans) {
            if (s1 - s0 > 0.35) {
              addBox(buckets, 'concrete', s1 - s0, h, 0.6, (s0 + s1) / 2, my + h / 2 - 0.3, zBand);
            }
          }
        }
      } else {
        // Graded retaining wall along a ramp's uphill edge.
        addBeam(buckets, 'concrete', [seg.ax + ox, ya + 0.55, seg.az + oz], [seg.bx + ox, yb + 0.55, seg.bz + oz], 0.58, 1.45);
      }
    }
  }

  /* 3. OPEN STEEL RAILINGS (1.05 m high) along every lake-facing drop and viewing bay */
  const RAIL_H = 1.05;
  for (const rseg of plan.railSegments()) {
    const dx = rseg.bx - rseg.ax, dz = rseg.bz - rseg.az;
    const len = Math.hypot(dx, dz);
    if (len < 0.1) continue;
    // Low concrete toe-kerb lifted cleanly above the road edge so it never z-fights with the cliff drop.
    addBeam(buckets, 'concrete', [rseg.ax, rseg.ya + 0.11, rseg.az], [rseg.bx, rseg.yb + 0.11, rseg.bz], 0.28, 0.20);
    // Top and knee rails: 48 mm painted tube (what safety rail is), the top rail at the same height and reach as before.
    addTube(buckets, 'paintYellow', [rseg.ax, rseg.ya + RAIL_H, rseg.az], [rseg.bx, rseg.yb + RAIL_H, rseg.bz], 0.026);
    addTube(buckets, 'paintYellow', [rseg.ax, rseg.ya + RAIL_H * 0.52, rseg.az], [rseg.bx, rseg.yb + RAIL_H * 0.52, rseg.bz], 0.021);
    // Tube posts every ~2.4 m, each on a base plate bolted to the toe kerb.
    const n = Math.max(2, Math.round(len / 2.4));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const px = rseg.ax + dx * t;
      const pz = rseg.az + dz * t;
      const py = rseg.ya + (rseg.yb - rseg.ya) * t;
      addTube(buckets, 'darkSteel', [px, py + 0.21, pz], [px, py + RAIL_H, pz], 0.03, 8);
      addBox(buckets, 'darkSteel', 0.13, 0.012, 0.13, px, py + 0.216, pz);
    }
  }

  // Merge each material bucket into one BufferGeometry for minimal draw calls.
  for (const [matKey, geos] of buckets) {
    if (!geos.length) continue;
    const merged = mergeGeometries(geos, false);
    for (const g of geos) g.dispose();
    if (!merged) continue;
    ctx.own(merged);
    const mat = ctx.M[SHELL_MAT[matKey]] || ctx.M[matKey] || ctx.M.concrete;
    const mesh = new THREE.Mesh(merged, mat);
    mesh.name = `shell:${matKey}`;
    mesh.castShadow = ctx.t4 && matKey !== 'paintYellow';
    mesh.receiveShadow = ctx.t4;
    mesh.userData.phys = 'ground';
    mesh.userData.noWeather = true;
    group.add(mesh);
  }

  return group;
}

/**
 * A far basalt spire (realism pass): a tapered column broken into ledges and buttresses by seeded noise in angle and
 * height, instead of a seven-sided prism. Far country only (`phys: 'ambient'`).
 */
function addSpire(buckets, rTop, rBot, h, x, y, z, rx, ry, rz, seed) {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, 28, 24, false);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i);
    const r = Math.hypot(px, pz);
    if (r < 1e-4) continue;
    const ca = px / r, sa = pz / r;
    const t = py / h + 0.5;
    const ledge = Math.floor(t * 7) / 7;
    const k = 0.72 + 0.5 * fbm2(ca * 2.6 + seed * 7, sa * 2.6 + t * 3.1, 131 + seed, 3) + 0.12 * Math.sin((t - ledge) * Math.PI);
    const nr = r * k;
    pos.setXYZ(i, ca * nr, py + (fbm2(ca * 3 + seed, sa * 3, 137, 2) - 0.5) * 2.5 * (t > 0.98 ? 1 : 0), sa * nr);
  }
  g.computeVertexNormals();
  if (rx || ry || rz) g.rotateX(rx).rotateY(ry).rotateZ(rz);
  g.translate(x, y, z);
  let arr = buckets.get('rock');
  if (!arr) { arr = []; buckets.set('rock', arr); }
  arr.push(g);
}

/**
 * Far-country landmarks beyond the walk (`phys: 'ambient'`, merged per material):
 * one volcanic/geothermal landmark per quarter of the horizon.
 */
export function buildCalderaVista(ctx, plan) {
  const group = new THREE.Group();
  group.name = 'ember-vista';
  group.userData.phys = 'ambient';
  group.userData.noWeather = true;

  const buckets = new Map();

  // 1. North-West: jagged basalt caldera spires rising out of the cooled lava floor (eroded columns, not prisms).
  const nwY = plan.height(-175, -210);
  addSpire(buckets, 4, 24, 68, -175, nwY + 32, -210, 0, 0, 0, 1);
  addSpire(buckets, 2.5, 14, 44, -158, nwY + 20, -200, 0.12, 0.4, -0.15, 2);

  // 2. East: geothermal ridge derrick & high vent stack on the east caldera wall bench
  const eY = plan.height(185, -90);
  addBox(buckets, 'concrete', 14, 6, 14, 185, eY + 2, -90);
  addCyl(buckets, 'rusted', 1.6, 2.2, 34, 10, 185, eY + 22, -90);
  addBox(buckets, 'darkSteel', 18, 2.5, 2.5, 185, eY + 12, -90);

  // 3. South: high ridge collector & relay mast cresting the south caldera rim
  const sY = plan.height(8, 205);
  addBox(buckets, 'concrete', 10, 4, 10, 8, sY + 1, 205);
  addCyl(buckets, 'darkSteel', 0.45, 1.4, 38, 8, 8, sY + 21, 205);
  addBox(buckets, 'steel', 12, 0.8, 0.8, 8, sY + 31, 205);

  for (const [matKey, geos] of buckets) {
    const merged = mergeGeometries(geos, false);
    for (const g of geos) g.dispose();
    if (!merged) continue;
    ctx.own(merged);
    const mesh = new THREE.Mesh(merged, ctx.M[matKey] || ctx.M.rock);
    mesh.name = `vista:${matKey}`;
    mesh.userData.phys = 'ambient';
    mesh.userData.noWeather = true;
    group.add(mesh);
  }
  return group;
}

/** A ribbon laid along a polyline in plan (re-exported for Mirrowen). */
export function buildRibbon(field, pts, width, { closed = false, lift = 0.03, step = 1.5 } = {}) {
  const P = [];
  const src = closed ? [...pts, pts[0]] : pts;
  for (let i = 0; i < src.length - 1; i++) {
    const [ax, az] = src[i], [bx, bz] = src[i + 1];
    const L = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.ceil(L / step));
    for (let k = 0; k < n; k++) P.push([ax + (bx - ax) * (k / n), az + (bz - az) * (k / n)]);
  }
  P.push(src[src.length - 1]);
  const pos = [], uv = [], idx = [];
  let along = 0;
  for (let i = 0; i < P.length; i++) {
    const prev = P[Math.max(0, i - 1)], next = P[Math.min(P.length - 1, i + 1)];
    let tx = next[0] - prev[0], tz = next[1] - prev[1];
    const tl = Math.hypot(tx, tz) || 1;
    tx /= tl; tz /= tl;
    const nx = -tz, nz = tx;
    if (i > 0) along += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
    for (const side of [-1, 1]) {
      const x = P[i][0] + nx * side * width / 2, z = P[i][1] + nz * side * width / 2;
      pos.push(x, field.height(x, z) + lift, z);
      uv.push(side < 0 ? 0 : 1, along / 4);
    }
    if (i > 0) {
      const a = (i - 1) * 2, b = i * 2;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('uv1', new THREE.Float32BufferAttribute(uv.slice(), 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const nrm = g.attributes.normal;
  let up = 0;
  for (let i = 0; i < nrm.count; i++) up += nrm.getY(i);
  if (up < 0) {
    for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
    g.setIndex(idx);
    g.computeVertexNormals();
  }
  return g;
}

/** A feathered disc (re-exported for Mirrowen). */
export function buildDisc(field, cx, cz, radius, { lift = 0.03, segments = 48, rings = 6 } = {}) {
  const pos = [], uv = [], idx = [];
  pos.push(cx, field.height(cx, cz) + lift, cz); uv.push(0.5, 0);
  for (let r = 1; r <= rings; r++) {
    const t = r / rings;
    for (let s = 0; s < segments; s++) {
      const a = (s / segments) * Math.PI * 2;
      const x = cx + Math.sin(a) * radius * t, z = cz + Math.cos(a) * radius * t;
      pos.push(x, field.height(x, z) + lift, z);
      uv.push(0.5 - 0.5 * t, (x - cx) / 4);
    }
  }
  for (let s = 0; s < segments; s++) idx.push(0, 1 + s, 1 + ((s + 1) % segments));
  for (let r = 1; r < rings; r++) {
    const a0 = 1 + (r - 1) * segments, a1 = 1 + r * segments;
    for (let s = 0; s < segments; s++) {
      const s1 = (s + 1) % segments;
      idx.push(a0 + s, a1 + s, a1 + s1, a0 + s, a1 + s1, a0 + s1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('uv1', new THREE.Float32BufferAttribute(uv.slice(), 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
