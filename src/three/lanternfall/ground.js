/**
 * lanternfall/ground.js — Lanternfall's land: the terrain mesh, the lake's ice, the faces cut through moraine and
 * glacier beside the walk, the pressure ridges along the shore, the snout's ice cliff, and the far country.
 *
 * ONE HEIGHT FUNCTION (`glacier-plan.js`): the mesh is drawn from `plan.surface`, which is the walk's floor inside an
 * open volume and the land everywhere else, the hill or the ice included over a room buried in it. Grid lines are
 * snapped onto every volume's sides and onto the lines a cut face stands between, so a face meets the ground at its
 * foot and at its top. The rooms that stand on the land (the caves on the lake ice, the crawler, the erratic) and
 * every door are cut out of the mesh; their shells draw their own floors.
 *
 * Everything here is `phys: 'ground'` and arrives merged, one mesh per material.
 */

import * as THREE from 'three';
import {
  LAKE, GLACIER, NUNATAK, EDGE, FACE_T, fbm2, ridge2, smooth, lakeE, glacierMask, glacierSurface, crevasseBend
} from './glacier-plan.js';
import { Buckets, rng } from './kit.js';

const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/* ======================================================================
   GRID AXES
   ====================================================================== */

function mergeLines(all, eps) {
  const v = [...all].sort((a, b) => a - b);
  const out = [];
  for (const x of v) if (!out.length || x - out[out.length - 1] > eps) out.push(x);
  return out;
}

function axisLines(core, step, reach, snaps) {
  const pos = [];
  for (let v = 0; v <= core; v += step) pos.push(v);
  let v = core, s = step;
  while (v < reach) { s *= 1.22; v = Math.min(reach, v + s); pos.push(v); }
  return mergeLines([...pos.slice(1).reverse().map(p => -p), ...pos, ...snaps], 0.1);
}

/* ======================================================================
   WHAT THE GROUND IS MADE OF (vertex colour)
   ====================================================================== */

const C = {
  snow: [0.86, 0.91, 0.95],
  drift: [0.93, 0.96, 0.98],
  trod: [0.70, 0.76, 0.80],
  rut: [0.52, 0.58, 0.63],
  glacier: [0.74, 0.84, 0.92],
  blue: [0.36, 0.55, 0.70],
  deep: [0.16, 0.27, 0.38],
  rubble: [0.40, 0.40, 0.41],
  till: [0.52, 0.51, 0.50],
  rock: [0.20, 0.21, 0.23],
  bed: [0.10, 0.14, 0.18]
};

function groundTint(x, z, y, slope, plan) {
  const v = plan.volumeAt(x, z);
  let c;
  if (v && ['yard', 'path', 'ramp'].includes(v.kind)) {
    // Packed, trodden snow: the line the sledges and boots take is darker and ridged with ruts.
    const r = v.rect;
    const along = (r.maxX - r.minX) > (r.maxZ - r.minZ) ? 'x' : 'z';
    const across = along === 'x' ? (z - (r.minZ + r.maxZ) / 2) / ((r.maxZ - r.minZ) / 2) : (x - (r.minX + r.maxX) / 2) / ((r.maxX - r.minX) / 2);
    const lane = 1 - smooth(0.25, 0.75, Math.abs(across));
    const ruts = Math.pow(Math.abs(Math.sin(across * 9.5)), 6) * lane;
    c = mix3(C.drift, C.trod, lane * 0.65 + fbm2(x * 0.3, z * 0.3, 31, 2) * 0.15);
    c = mix3(c, C.rut, ruts * 0.45);
  } else if (lakeE(x, z) < 0.98) {
    c = C.bed;
  } else {
    const gm = glacierMask(x, z);
    const rn = Math.hypot(x - NUNATAK.x, z - NUNATAK.z);
    // Snow lies on what is flat; what is steep shows what the land is made of.
    const bare = smooth(0.18, 0.5, slope);
    let under;
    if (rn < NUNATAK.r * 1.05) under = mix3(C.rock, C.rubble, fbm2(x * 0.2, z * 0.2, 37, 2) * 0.4);
    else if (gm > 0.5) {
      // Glacier ice where the wind has scoured the snow off: blue-white.
      under = mix3(C.glacier, C.blue, 0.35);
    } else under = mix3(C.till, C.rubble, fbm2(x * 0.12, z * 0.12, 41, 3));
    const flatSnow = gm > 0.5 && rn > NUNATAK.r ? C.glacier : C.snow;
    c = mix3(flatSnow, under, bare);
    // Wind drifts in the lee of the moraines.
    c = mix3(c, C.drift, (1 - bare) * fbm2(x * 0.04, z * 0.04, 43, 2) * 0.35);
  }
  const grain = 0.94 + fbm2(x * 0.5, z * 0.5, 101, 2) * 0.1;
  return [c[0] * grain, c[1] * grain, c[2] * grain];
}

/* ======================================================================
   TERRAIN MESH
   ====================================================================== */

export function buildTerrainGeometry(plan) {
  const holes = plan.holes();
  const snapX = [], snapZ = [];
  for (const v of plan.volumes) {
    snapX.push(v.rect.minX, v.rect.maxX);
    snapZ.push(v.rect.minZ, v.rect.maxZ);
  }
  for (const v of plan.openVols) {
    for (const d of [EDGE, FACE_T + 0.05]) {
      snapX.push(v.rect.minX - d, v.rect.maxX + d);
      snapZ.push(v.rect.minZ - d, v.rect.maxZ + d);
    }
  }
  for (const h of holes) { snapX.push(h.minX, h.maxX); snapZ.push(h.minZ, h.maxZ); }
  const xs = axisLines(104, 3, 900, snapX);
  const zs = axisLines(104, 3, 900, snapZ);
  const nx = xs.length, nz = zs.length;

  const inHole = (x, z) => holes.some(h => x > h.minX && x < h.maxX && z > h.minZ && z < h.maxZ);
  const onRim = (x, z) => holes.some(h => x >= h.minX - 0.05 && x <= h.maxX + 0.05 && z >= h.minZ - 0.05 && z <= h.maxZ + 0.05);

  const pos = new Float32Array(nx * nz * 3);
  const uv = new Float32Array(nx * nz * 2);
  for (let j = 0; j < nz; j++) {
    const z = zs[j];
    for (let i = 0; i < nx; i++) {
      const x = xs[i];
      const y = onRim(x, z) && !plan.volumeAt(x, z) ? plan.landHeight(x, z) : plan.surface(x, z);
      const k = j * nx + i;
      pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z;
      uv[k * 2] = x * 0.09; uv[k * 2 + 1] = z * 0.09;
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
  const col = new Float32Array(nx * nz * 3);
  for (let k = 0; k < nx * nz; k++) {
    const slope = 1 - Math.max(0, norm.getY(k));
    const [r, g, b] = groundTint(pos[k * 3], pos[k * 3 + 2], pos[k * 3 + 1], slope, plan);
    col[k * 3] = r; col[k * 3 + 1] = g; col[k * 3 + 2] = b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

/* ======================================================================
   THE LAKE'S ICE
   A grid over the ellipse, with every cell left out that a walk volume or a room stands over.
   ====================================================================== */

export function buildLakeGeometry(plan) {
  const holes = [...plan.holes(), ...plan.volumes.map(v => v.rect)];
  const step = 1.5;
  const pos = [], uv = [], idx = [];
  const cols = Math.ceil(LAKE.rx * 2.1 / step), rows = Math.ceil(LAKE.rz * 2.1 / step);
  const x0 = LAKE.x - LAKE.rx * 1.05, z0 = LAKE.z - LAKE.rz * 1.05;
  const vid = new Map();
  const vert = (i, j) => {
    const k = i * 10000 + j;
    if (vid.has(k)) return vid.get(k);
    const x = x0 + i * step, z = z0 + j * step;
    pos.push(x, LAKE.ice, z);
    uv.push(x * 0.045, z * 0.045);
    vid.set(k, pos.length / 3 - 1);
    return pos.length / 3 - 1;
  };
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const cx = x0 + (i + 0.5) * step, cz = z0 + (j + 0.5) * step;
      if (lakeE(cx, cz) > 1.04) continue;
      if (holes.some(h => cx > h.minX - 0.8 && cx < h.maxX + 0.8 && cz > h.minZ - 0.8 && cz < h.maxZ + 0.8)) continue;
      // Under the snout the lake's ice runs in under the cliff; the land is higher there anyway.
      if (plan.landHeight(cx, cz) > LAKE.ice - 0.05) continue;
      const a = vert(i, j), b = vert(i + 1, j), c = vert(i, j + 1), d = vert(i + 1, j + 1);
      idx.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/* ======================================================================
   CUT FACES, SHORE RIDGES, THE SNOUT
   ====================================================================== */

/** Ice in section: white firn over blue ice, with dark bands of dirt where old surfaces were buried. */
function iceSection(x, y, z) {
  const band = Math.sin(y * 1.9 + fbm2(x * 0.1, z * 0.1, 51, 2) * 3);
  let c = mix3([0.80, 0.88, 0.94], [0.42, 0.62, 0.78], smooth(0.4, -0.6, band));
  if (Math.abs(Math.sin(y * 0.55 + x * 0.02)) < 0.06) c = mix3(c, [0.32, 0.33, 0.35], 0.6);
  return c;
}

/** Moraine in section: boulders and cobbles in grey till, the cobbles darker and the till pale with frost. */
function tillSection(x, y, z) {
  const w = fbm2(x * 0.9 + z * 0.9, y * 1.1, 61, 3);
  let c = mix3([0.55, 0.54, 0.52], [0.30, 0.30, 0.31], smooth(0.55, 0.7, w));
  if (fbm2(x * 0.3 + z * 0.3, y * 0.3, 63, 2) > 0.62) c = mix3(c, [0.82, 0.86, 0.9], 0.5);
  return c;
}

/**
 * Every cut face (`plan.cutFaces()`): a sheet from below the floor to the land's top, set back behind the volume's
 * side and roughened away from the walk (never into it), painted as the ice or the moraine it is cut through.
 */
export function buildCutFaces(ctx, plan) {
  const b = new Buckets();
  for (const f of plan.cutFaces()) {
    const [ax, az] = f.a, [bx, bz] = f.b;
    const ox = -f.dirX, oz = -f.dirZ;       // out of the walk, into the land
    const len = Math.hypot(bx - ax, bz - az);
    const nu = Math.max(2, Math.round(len / 0.7));
    const lo = Math.min(...f.floor) - 0.4;
    const hiA = f.top[0] + 0.15, hiB = f.top[1] + 0.15;
    const nv = Math.max(2, Math.round((Math.max(hiA, hiB) - lo) / 0.7));
    const key = f.ice ? 'faceIce' : 'faceTill';
    // The winding faces INTO the walk.
    const flip = (f.dirX * (bz - az) - f.dirZ * (bx - ax)) > 0;
    b.sheet(key, nu, nv, (u0, v) => {
      const u = flip ? 1 - u0 : u0;
      const x = ax + (bx - ax) * u, z = az + (bz - az) * u;
      const top = hiA + (hiB - hiA) * u;
      const y = lo + (top - lo) * v;
      const rough = (f.ice ? 0.18 : 0.32) * fbm2(x * 0.9 + z * 0.9, y * 0.9, 7, 2) + 0.06;
      const inset = 0.04 + Math.min(FACE_T - 0.06, rough) * smooth(0, 0.08, v) * smooth(1, 0.92, v);
      return [x + ox * inset, y, z + oz * inset];
    }, f.ice ? iceSection : tillSection);
  }
  return b.build(ctx.M, 'lanternfall-cut-faces', { shadows: false });
}

/**
 * The shore's pressure ridges: slabs of lake ice broken by the push of the glacier, tilted and piled along the
 * edges of the walk that look down to the lake. Each slab stands on the land beyond the edge, never in the walk.
 */
export function buildShoreRidges(ctx, plan) {
  const b = new Buckets();
  const r = rng(907);
  const placed = [];
  for (const e of plan.shoreEdges()) {
    const n = 1 + Math.floor(r() * 2.4);
    for (let k = 0; k < n; k++) {
      const off = 1.4 + r() * 3.2;
      const along = (r() - 0.5) * 1.6;
      const px = e.at[0] + e.out[0] * off + e.out[1] * along;
      const pz = e.at[1] + e.out[1] * off - e.out[0] * along;
      if (plan.volumeAt(px, pz) || plan.inBuilt(px, pz, 1.8)) continue;
      // Not where a cut face stands, or on the far side of a room.
      if (placed.some(p => Math.hypot(p[0] - px, p[1] - pz) < 1.3)) continue;
      const gy = plan.landHeight(px, pz);
      // Only on the lake or the shore bank: never up on a moraine.
      if (gy > e.floor - 0.5) continue;
      const L = 1.4 + r() * 2.0, W = 1.0 + r() * 1.4, T = 0.25 + r() * 0.2;
      const yaw = Math.atan2(e.out[0], e.out[1]) + (r() - 0.5) * 0.9;
      const tilt = 0.35 + r() * 0.7;
      b.box('slab', [L, T, W], [px, gy + Math.sin(tilt) * W * 0.32, pz], [tilt * (r() < 0.5 ? 1 : -1), yaw, (r() - 0.5) * 0.4]);
      placed.push([px, pz]);
    }
  }
  // The open ridge out on the lake: a line of rafted slabs across the ice from the snout's foot toward the south-east.
  for (let i = 0; i < 46; i++) {
    const t = i / 45;
    const px = -20 + t * 46 + (r() - 0.5) * 2.5, pz = -9 + t * 22 + (r() - 0.5) * 2.5;
    if (lakeE(px, pz) > 0.86 || plan.inBuilt(px, pz, 3)) continue;
    const L = 1.6 + r() * 2.4, W = 1.0 + r() * 1.6;
    b.box('slab', [L, 0.3, W], [px, LAKE.ice + 0.2 + r() * 0.5, pz], [0.4 + r() * 0.8, Math.atan2(46, 22) + (r() - 0.5), (r() - 0.5) * 0.5]);
  }
  return b.build(ctx.M, 'lanternfall-shore-ridges', { shadows: ctx.t4 });
}

/** The snout: the glacier's end as a cliff of ice standing on the lake, its top broken into seracs. */
export function buildSnout(ctx) {
  const b = new Buckets();
  const x0 = GLACIER.west - 2, x1 = GLACIER.east + 2;
  const nu = Math.round((x1 - x0) / 0.8);
  b.sheet('faceIce', nu, 22, (u, v) => {
    const x = x0 + (x1 - x0) * u;
    const edge = smooth(x0, x0 + 6, x) * smooth(x1, x1 - 6, x);
    const top = LAKE.ice + (glacierSurface(x, GLACIER.snout) + 0.4 - LAKE.ice) * edge;
    const serac = (ridge2(x * 0.35, 3.1, 81, 2) - 0.5) * 2.4 * edge;
    const y = LAKE.ice - 0.3 + (top + serac + 0.3) * v;
    const z = GLACIER.snout + 1.1 + (fbm2(x * 0.25, y * 0.2, 83, 2) - 0.5) * 1.6 * smooth(0, 0.3, v);
    return [x, y, z];
  }, iceSection);
  return b.build(ctx.M, 'lanternfall-snout', { shadows: false });
}

/**
 * THE CREVASSE FIELD between the crossing and the snout: each crack a slot a metre or so wide across the tongue, its
 * lips of snow, its inside blue going to black. Drawn as two walls going down into the ice from the surface and a
 * dark floor two to four metres down, so the cracks read from the crossing and from the shore.
 */
export function buildCrevasses(ctx, plan) {
  const b = new Buckets();
  const r = rng(515);
  const keep = (x, z) => !plan.volumeAt(x, z) && !plan.inBuilt(x, z, 2.2) && plan.landHeight(x, z) > 12 &&
    !plan.openVols.some(v => x > v.rect.minX - 2.2 && x < v.rect.maxX + 2.2 && z > v.rect.minZ - 2.2 && z < v.rect.maxZ + 2.2);
  const step = Math.PI / 0.42;
  for (let zk = -58; zk < GLACIER.snout - 4; zk += step * (0.8 + r() * 0.4)) {
    const x0 = GLACIER.west + 4 + r() * 6, x1 = GLACIER.east - 3 - r() * 6;
    let run = [];
    const flush = () => {
      if (run.length < 3) { run = []; return; }
      const pts = run;
      const n = pts.length - 1;
      b.sheet('crevasse', n, 4, (u, v) => {
        const i = Math.min(n, Math.round(u * n));
        const [x, z, y, wdt] = pts[i];
        return [x, y + 0.05, z + (v * 2 - 1) * wdt];
      });
      // The dark of the crack, a narrower ribbon in the middle of the opening.
      b.sheet('crevasseDeep', n, 1, (u, v) => {
        const i = Math.min(n, Math.round(u * n));
        const [x, z, y, wdt] = pts[i];
        return [x, y + 0.07, z + (v * 2 - 1) * wdt * 0.55];
      });
      run = [];
    };
    for (let x = x0; x <= x1; x += 1.5) {
      const z = zk - crevasseBend(x);
      const t = (x - x0) / (x1 - x0);
      const wdt = (0.35 + 0.5 * Math.sin(Math.PI * t)) * (0.8 + 0.4 * fbm2(x * 0.2, zk, 19, 2));
      if (!keep(x, z) || !keep(x, z - wdt - 0.5) || !keep(x, z + wdt + 0.5)) { flush(); continue; }
      run.push([x, z, plan.landHeight(x, z), wdt, 2.2 + 1.8 * Math.sin(Math.PI * t)]);
    }
    flush();
  }
  return b.build(ctx.M, 'lanternfall-crevasses', { shadows: false });
}

/* ======================================================================
   THE FAR COUNTRY (phys: 'ambient')
   ====================================================================== */

/**
 * One landmark per quarter of the horizon that is this world's: the icefall's seracs to the north, the line of
 * aurora masts on the east moraine (built by the world from `props.js`), the outwash plain's braided channels and the
 * comms mast to the south, the tower on the nunatak's summit to the west.
 */
export function buildVista(ctx, plan) {
  const b = new Buckets();
  const r = rng(311);
  // NORTH: the icefall, where the glacier comes down a step in its bed and breaks into blocks.
  for (let i = 0; i < 140; i++) {
    const x = -70 + r() * 150, z = -180 - r() * 120;
    const y = plan.landHeight(x, z);
    const s = 3 + r() * 7;
    b.box('serac', [s, s * (0.8 + r()), s * (0.6 + r() * 0.5)], [x, y + s * 0.3, z], [(r() - 0.5) * 0.5, r() * 3, (r() - 0.5) * 0.4]);
  }
  // SOUTH: the outwash plain's channels, frozen, braided down to the south.
  for (let k = 0; k < 5; k++) {
    let x = -30 + k * 16, z = 80;
    for (let i = 0; i < 26; i++) {
      const nx = x + (fbm2(i * 0.3, k * 7, 91, 2) - 0.5) * 18, nz = z + 9;
      const y = plan.landHeight((x + nx) / 2, (z + nz) / 2) + 0.03;
      const len = Math.hypot(nx - x, nz - z);
      b.box('channel', [1.6 + r() * 1.2, 0.04, len + 0.4], [(x + nx) / 2, y, (z + nz) / 2], [0, Math.atan2(nx - x, nz - z), 0]);
      x = nx; z = nz;
    }
  }
  // WEST: the tower on the nunatak's summit (a lattice of four legs), and its stays.
  {
    const tx = NUNATAK.x + 2, tz = NUNATAK.z + 1;
    const gy = plan.landHeight(tx, tz) - 0.3;
    const H = 16;
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      b.rod('steel', [tx + sx * 2.0, gy, tz + sz * 2.0], [tx + sx * 0.5, gy + H, tz + sz * 0.5], 0.09);
    }
    for (let k = 0; k < 6; k++) {
      const y0 = gy + k * (H / 6), y1 = gy + (k + 1) * (H / 6);
      const w0 = 2.0 - 1.5 * (k / 6), w1 = 2.0 - 1.5 * ((k + 1) / 6);
      for (const [a, c] of [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]]) {
        b.rod('steel', [tx + a[0] * w0, y0, tz + a[1] * w0], [tx + c[0] * w1, y1, tz + c[1] * w1], 0.035);
      }
    }
    b.box('darkSteel', [1.6, 1.0, 1.6], [tx, gy + H + 0.5, tz]);
    b.cyl('steel', 0.04, 0.04, 4, 6, [tx, gy + H + 3, tz]);
  }
  return b.build(ctx.M, 'lanternfall-vista', { phys: 'ambient', shadows: false });
}
