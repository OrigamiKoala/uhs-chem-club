/**
 * lodestone/terrain.js — The canyon's ground and its rock, from the one plan (`canyon-plan.js`).
 *
 * ONE HEIGHT FIELD. `field.height(x, z)` is the plan's: the walk's floor inside the walk (the hollow, the runs graded
 * between level landings, the alcoves, the pothole) and the rock outside it, held at the floor for 1.6 m past the edge,
 * then rising to the tableland. The pad's plate is let into the hollow's floor. The walk, the landing solver and every
 * Node check stand on exactly this function.
 *
 * WHAT IS DRAWN
 *   the ground     one grid mesh to the horizon (1 m cells across the walk, growing to a 900 m disc), sampled from the
 *                  height field. Where the rock rises it does so 1.6 to 3.6 m behind the walk's edge, hidden by:
 *   the faces      the canyon's walls: a sheet of rock stood along the walk's whole edge (`plan.edgeLoops()`), from
 *                  under the floor to the tableland, its courses stepped in and out by the beds (a hard bed stands
 *                  proud, a soft one is cut back) and broken at the joints. It never leans over the walk. Over an alcove
 *                  it stops at the roof.
 *   the roofs      over each alcove, the overhanging bed: a block of rock from the roof to above the tableland, its
 *                  underside and its lip broken a little. A stepped roof is two blocks; a chimney is a gap between two.
 * The faces and roofs are GROUND (`phys: 'ground'`): everything stands in them, as Kettle's walls are. All three wear the
 * banded rock (`rock.js`), which colours by height in the world, so a bed runs level across all of them.
 */

import * as THREE from 'three';
import { fbm } from './canyon-plan.js';

const smooth = (a, b, t) => { const x = Math.max(0, Math.min(1, (t - a) / (b - a))); return x * x * (3 - 2 * x); };

export function makeLodestoneField(plan, pad) {
  const PAD_TOP = 0.12;
  const PAD_R = 9.4;
  const height = (x, z) => {
    const y = plan.height(x, z);
    if (pad) {
      const d = Math.hypot(x - pad[0], z - pad[1]);
      if (d < PAD_R + 0.6) return y + PAD_TOP * (1 - smooth(PAD_R - 0.05, PAD_R + 0.6, d));
    }
    return y;
  };
  return { height, PAD_TOP, PAD_R };
}

/* ------------------------------------------------------------------ the ground */

function axisLines(core, step, reach) {
  const pos = [];
  for (let v = 0; v <= core; v += step) pos.push(v);
  let v = core, s = step;
  while (v < reach) { s *= 1.22; v = Math.min(reach, v + s); pos.push(v); }
  return pos;
}

/** One grid to the horizon, sampled from the height field: 1 m across the walk, coarser outward. */
export function buildGroundGeometry(field, plan) {
  const b = plan.bounds;
  // The fine core covers the walk and the rock round it; the axes are offset so the walk's square is centred.
  const cx = Math.round((b.minX + b.maxX) / 2), cz = Math.round((b.minZ + b.maxZ) / 2);
  const half = Math.ceil(Math.max(b.maxX - b.minX, b.maxZ - b.minZ) / 2) + 8;
  const ax = axisLines(half, 1, 900);
  const xs = [...ax.slice(1).reverse().map(p => cx - p), ...ax.map(p => cx + p)];
  const zs = [...ax.slice(1).reverse().map(p => cz - p), ...ax.map(p => cz + p)];
  const nx = xs.length, nz = zs.length;
  const positions = new Float32Array(nx * nz * 3);
  const uvs = new Float32Array(nx * nz * 2);
  const TILE = 7;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = xs[i], z = zs[j], k = j * nx + i;
    positions[k * 3] = x; positions[k * 3 + 1] = field.height(x, z); positions[k * 3 + 2] = z;
    uvs[k * 2] = x / TILE; uvs[k * 2 + 1] = z / TILE;
  }
  const index = new Uint32Array((nx - 1) * (nz - 1) * 6);
  let p = 0;
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = j * nx + i, b2 = a + 1, c = a + nx, d = c + 1;
    index[p++] = a; index[p++] = c; index[p++] = b2;
    index[p++] = b2; index[p++] = c; index[p++] = d;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setAttribute('uv1', new THREE.BufferAttribute(uvs.slice(), 2));
  geo.setIndex(new THREE.BufferAttribute(index, 1));
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

/* ------------------------------------------------------------------ the faces */

/**
 * How far a face stands back from the walk's edge at height `y`, `along` m round the edge: the beds. A hard bed (the
 * iron-rich ones) stands proud; a soft one between is cut back; a vertical joint every few metres breaks a course. Always
 * between 0.15 and 0.95 m: never over the walk, never behind where the ground starts to rise (1.6 m).
 */
export function faceSetback(y, along) {
  const bed = fbm(y * 0.62, 3.3, 41, 2);
  const hard = smooth(0.42, 0.62, bed);
  const joint = fbm(along * 0.21, Math.floor(y / 2.3) * 1.7, 57, 2);
  const block = Math.floor(along / 3.1 + fbm(y * 0.2, 1.1, 61, 1) * 2);
  const jitter = (Math.sin(block * 12.9898 + Math.floor(y / 1.15) * 78.233) * 43758.5453) % 1;
  return 0.15 + (1 - hard) * 0.48 + Math.abs(jitter) * 0.12 + joint * 0.2;
}

/**
 * The canyon's faces: a sheet along every loop of the walk's edge, from 0.6 m under the floor to the tableland (or an
 * alcove's roof), stepped by the beds, closed at the top by a lip back to where the ground has risen.
 */
export function buildFaceGeometry(field, plan) {
  const loops = plan.edgeLoops();
  const positions = [], uvs = [], index = [], stains = [];
  const ROW = 1.15, STEP = 1.0;
  for (const loop of loops) {
    // Resample the loop at <= STEP m.
    const pts = [];
    for (let i = 0; i < loop.length; i++) {
      const a = loop[i], b = loop[(i + 1) % loop.length];
      const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / STEP));
      for (let k = 0; k < n; k++) pts.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
    }
    const N = pts.length;
    // Outward normals (the walk is on the left of the loop's direction, so outward is to the right), averaged at corners.
    const out = pts.map((p, i) => {
      const a = pts[(i - 1 + N) % N], b = pts[(i + 1) % N];
      const tx = b[0] - a[0], tz = b[1] - a[1], l = Math.hypot(tx, tz) || 1;
      return [tz / l, -tx / l];
    });
    let along = 0;
    const columns = pts.map((p, i) => {
      if (i > 0) along += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
      const [x, z] = p;
      const floor = plan.sample(x - out[i][0] * 0.3, z - out[i][1] * 0.3).floor;
      const roof = plan.roofOver(x - out[i][0] * 0.3, z - out[i][1] * 0.3);
      const T = plan.tableland(x + out[i][0] * 4, z + out[i][1] * 4);
      const top = roof === null || roof === Infinity ? Math.max(floor + 2, T + 0.4) : floor + roof + 0.5;
      const shape = plan.sample(x - out[i][0] * 0.3, z - out[i][1] * 0.3).shape;
      return { x, z, floor, top, open: roof === null || roof === Infinity, along, n: out[i], alcove: plan.alcoveById.get(shape) || null };
    });
    const rows = Math.max(...columns.map(c => Math.ceil((c.top - c.floor + 0.6) / ROW)));
    const base = positions.length / 3;
    const per = rows + 2;
    for (const c of columns) {
      for (let r = 0; r <= rows; r++) {
        const y = c.floor - 0.6 + (c.top - c.floor + 0.6) * (r / rows);
        const set = faceSetback(y, c.along);
        positions.push(c.x + c.n[0] * set, y, c.z + c.n[1] * set);
        uvs.push(c.along / 3, y / 3);
        stains.push(...stainAt(c, y));
      }
      // The lip: back into the rock to where the ground has risen, a little under the tableland's own surface there.
      const lx = c.x + c.n[0] * 3.9, lz = c.z + c.n[1] * 3.9;
      const ly = c.open ? Math.min(c.top, field.height(lx, lz) - 0.05) : c.top;
      positions.push(lx, ly, lz);
      uvs.push(c.along / 3, ly / 3 + 1);
      stains.push(0, 0);
    }
    for (let i = 0; i < N; i++) {
      const a = base + i * per, b = base + ((i + 1) % N) * per;
      for (let r = 0; r < per - 1; r++) {
        // Wound so the face looks INTO the walk.
        index.push(a + r, b + r, a + r + 1);
        index.push(b + r, b + r + 1, a + r + 1);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('uv1', new THREE.Float32BufferAttribute(uvs.slice(), 2));
  geo.setAttribute('lsStain', new THREE.Float32BufferAttribute(stains, 2));
  geo.setIndex(index);
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

/**
 * What stains an alcove's walls (`rock.js` STAIN): in the chimney, streaks run down from the cleft (copper blue-green,
 * iron ochre, manganese black, by joint); at the manganese face, a black seam crosses the walls a metre up; in the
 * magnetite pocket, two black bands of magnetite. Elsewhere nothing.
 */
function stainAt(c, y) {
  const al = c.alcove;
  if (!al) return [0, 0];
  const h = y - al.floor;
  if (al.id === 'chimney') {
    const joint = Math.floor(c.along / 0.9);
    const pick = Math.abs(Math.sin(joint * 12.9898) * 43758.5453) % 1;
    const kind = pick < 0.45 ? 0 : pick < 0.75 ? 1 : 2;
    const streak = smooth(0.25, 0.75, fbm(c.along * 0.9, 0.5, 83, 2));
    return [streak * smooth(-0.3, 1.2, h) * (1 - smooth(al.roof + 2, al.roof + 6, h)) * 0.85, kind];
  }
  if (al.id === 'manganese-face') {
    const wob = (fbm(c.along * 0.35, 2.1, 89, 2) - 0.5) * 0.5;
    return [smooth(0.85, 1.05, h + wob) * (1 - smooth(2.35, 2.6, h + wob)) * 0.92, 2];
  }
  if (al.id === 'magnetite-pocket') {
    const wob = (fbm(c.along * 0.3, 4.7, 97, 2) - 0.5) * 0.3;
    const band = (a, b) => smooth(a - 0.08, a + 0.08, h + wob) * (1 - smooth(b - 0.08, b + 0.08, h + wob));
    return [Math.max(band(1.2, 2.05), band(3.0, 3.45)), 2];
  }
  return [0, 0];
}

/* ------------------------------------------------------------------ the roofs */

/** A box whose faces are cut into ~1 m quads, so its underside and lip can be broken by the beds. */
function roughBlock(minX, maxX, y0, y1, minZ, maxZ, { lipSide, seed }) {
  const sx = maxX - minX, sy = y1 - y0, sz = maxZ - minZ;
  const g = new THREE.BoxGeometry(sx, sy, sz, Math.max(1, Math.round(sx)), Math.max(1, Math.round(sy / 1.2)), Math.max(1, Math.round(sz)));
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const lx = pos.getX(i), ly = pos.getY(i), lz = pos.getZ(i);
    const x = lx + (minX + maxX) / 2, y = ly + (y0 + y1) / 2, z = lz + (minZ + maxZ) / 2;
    // The underside is the bed's base: hollowed UP into the block by up to 0.35 m, never down into the room.
    if (Math.abs(ly + sy / 2) < 1e-4) {
      const edge = Math.min(Math.abs(lx) - sx / 2, Math.abs(lz) - sz / 2);
      const k = smooth(0, 1.2, -edge);
      pos.setY(i, ly + k * 0.35 * fbm(x * 0.4, z * 0.4, seed, 2));
    }
    // The lip's face is broken by the beds, set back (into the block), never out over the canyon.
    const onLip = lipSide === 'maxX' ? Math.abs(lx - sx / 2) < 1e-4 : lipSide === 'minX' ? Math.abs(lx + sx / 2) < 1e-4
      : lipSide === 'maxZ' ? Math.abs(lz - sz / 2) < 1e-4 : Math.abs(lz + sz / 2) < 1e-4;
    if (onLip && ly > -sy / 2 + 1e-4 && ly < sy / 2 - 1e-4) {
      const set = faceSetback(y, (lipSide === 'maxX' || lipSide === 'minX') ? z : x) - 0.15;
      const ax = lipSide === 'maxX' ? -1 : lipSide === 'minX' ? 1 : 0, az = lipSide === 'maxZ' ? -1 : lipSide === 'minZ' ? 1 : 0;
      pos.setX(i, lx + ax * set);
      pos.setZ(i, lz + az * set);
    }
    // Texture in metres.
    uv.setXY(i, (x + z) / 3, y / 3);
  }
  g.translate((minX + maxX) / 2, (y0 + y1) / 2, (minZ + maxZ) / 2);
  g.computeVertexNormals();
  g.setAttribute('uv1', g.attributes.uv.clone());
  return g;
}

/**
 * The overhanging bed over every alcove, as geometries in the world frame: from its roof to a metre over the tableland
 * round it, reaching 1.2 m into the rock on the three closed sides and stopping at the mouth's plane on the open one.
 */
export function buildRoofGeometries(plan) {
  const out = [];
  plan.alcoves.forEach((al, n) => {
    const r = al.rect, side = al.side;
    const grow = s => (s === side ? 0 : 1.2);
    let minX = r.minX - grow('minX'), maxX = r.maxX + grow('maxX'), minZ = r.minZ - grow('minZ'), maxZ = r.maxZ + grow('maxZ');
    let topT = -Infinity;
    for (const x of [minX, maxX]) for (const z of [minZ, maxZ]) topT = Math.max(topT, plan.tableland(x, z));
    const top = topT + 1.0;
    // Pieces along the depth (back to mouth), each with its own roof height; the chimney is a gap.
    const depth = side === 'maxX' || side === 'minX' ? r.maxX - r.minX : r.maxZ - r.minZ;
    const cuts = [];
    if (al.chimney) cuts.push([-1.2, al.chimney[0], al.roof], [al.chimney[1], depth, al.roof]);
    else if (al.roofBack) cuts.push([-1.2, al.backDepth, al.roofBack], [al.backDepth, depth, al.roof]);
    else cuts.push([-1.2, depth, al.roof]);
    for (const [d0, d1, roof] of cuts) {
      // From-back distances to world ranges along the facing axis.
      let a = minX, b = maxX, c = minZ, d = maxZ;
      if (side === 'maxX') { a = r.minX + d0; b = r.minX + d1; }
      if (side === 'minX') { b = r.maxX - d0; a = r.maxX - d1; }
      if (side === 'maxZ') { c = r.minZ + d0; d = r.minZ + d1; }
      if (side === 'minZ') { d = r.maxZ - d0; c = r.maxZ - d1; }
      const lip = d1 >= depth - 1e-6 ? side : null;
      const g = roughBlock(a, b, al.floor + roof, top, c, d, { lipSide: lip, seed: 71 + n });
      g.userData = { alcove: al.id };
      out.push(g);
    }
  });
  return out;
}
