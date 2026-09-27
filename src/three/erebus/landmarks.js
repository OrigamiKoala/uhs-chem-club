/**
 * landmarks.js — What stands on the ground the player walks.
 *
 * Each landmark in `erebus.json` names its kind, where it stands, its seed and
 * its footprint `radius` (which the landing solver keeps the Avalon off). Each
 * builder returns ONE group — the object and everything that is part of it,
 * such as the scree that has fallen off a spire — and the colliders the walk
 * meets. One group is one object to the overlap check, which is right: a stone
 * that fell off a spire lying against its foot is not two things drawn through
 * each other.
 *
 * Kinds:
 *   spire, hoodoos, butte, outcrop  sandstone remnants (rocks.js columns)
 *   boulders                        a spill of fractured blocks
 *   arch                            a natural arch you can walk under
 *   skeleton                        the bones of something very large
 *   wreck                           a derelict freighter, broken-backed, half buried
 */

import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { cableRun, mergeStatic } from '../materials/pbr-kit.js';
import { hullMaterial } from './surfaces.js';
import { rng, fbm2, lerp } from './noise.js';
import { boulderGeometry, columnGeometry, archGeometry, recordInstanceBoxes } from './rocks.js';
import { loft, frame } from './lander.js';

/* ------------------------------------------------------------------ helpers */

/** A tube swept along points, tapering from r0 to r1, with a little knobbling. */
export function taperedTube(points, r0, r1, { radial = 10, segs = 32, knob = 0.08, seed = 1 } = {}) {
  const curve = new THREE.CatmullRomCurve3(points);
  const frames = curve.computeFrenetFrames(segs, false);
  const pos = [], uv = [], idx = [];
  const len = curve.getLength();
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const p = curve.getPointAt(t);
    const N = frames.normals[i], B = frames.binormals[i];
    const r = lerp(r0, r1, Math.pow(t, 0.9)) * (1 + knob * fbm2(t * 9 + seed, seed * 0.37, 2));
    for (let k = 0; k <= radial; k++) {
      const a = (k / radial) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      pos.push(p.x + (N.x * ca + B.x * sa) * r, p.y + (N.y * ca + B.y * sa) * r, p.z + (N.z * ca + B.z * sa) * r);
      uv.push(k / radial, t * len * 0.5);
    }
  }
  const row = radial + 1;
  for (let i = 0; i < segs; i++) {
    for (let k = 0; k < radial; k++) {
      const a = i * row + k, b = a + 1, c = a + row, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  // Close the tip.
  const tip = pos.length / 3;
  const e = curve.getPointAt(1);
  pos.push(e.x, e.y, e.z); uv.push(0.5, len * 0.5);
  for (let k = 0; k < radial; k++) idx.push(segs * row + k, segs * row + k + 1, tip);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** A group standing at `lm.pos` on the ground, turned by `lm.rotY`, plus the local↔world maps. */
function place(lm, ctx, yOverride = null) {
  const [x, , z] = lm.pos;
  const gy = yOverride ?? ctx.heightAt(x, z);
  const group = new THREE.Group();
  group.name = `${lm.asset}-${lm.seed ?? 0}`;
  group.position.set(x, gy, z);
  group.rotation.y = lm.rotY || 0;
  const c = Math.cos(group.rotation.y), s = Math.sin(group.rotation.y);
  const toWorld = (lx, lz) => ({ x: x + lx * c + lz * s, z: z - lx * s + lz * c });
  const toLocal = (wx, wz) => {
    const dx = wx - x, dz = wz - z;
    return { x: dx * c - dz * s, z: dx * s + dz * c };
  };
  const ground = (lx, lz) => {
    const w = toWorld(lx, lz);
    return ctx.heightAt(w.x, w.z) - gy;
  };
  return { group, gy, toWorld, toLocal, ground };
}

/** Geometry shared by every scree field: three small broken stones. */
let SCREE_GEOS = null;
function screeGeos() {
  if (!SCREE_GEOS) {
    SCREE_GEOS = [
      boulderGeometry(0x11, { detail: 1, scale: [1, 0.62, 0.85], cuts: 4 }),
      boulderGeometry(0x22, { detail: 1, scale: [0.9, 0.5, 1.1], cuts: 5 }),
      boulderGeometry(0x33, { detail: 2, scale: [1.1, 0.75, 0.9], cuts: 3 })
    ];
  }
  return SCREE_GEOS;
}

/**
 * Stones fallen from a face, lying round its foot on the ground under each one.
 * `spots` are local (x, z) centres with a radius; stones land in a ring outside it.
 */
function scree(P, mat, seed, spots, { count = 40, reach = 0.55, size = [0.12, 0.7] } = {}) {
  const r = rng(seed);
  const geos = screeGeos();
  const lists = geos.map(() => []);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), p = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const spot = spots[Math.floor(r() * spots.length)];
    const a = r() * Math.PI * 2;
    // Most stones lie close in; a few rolled further.
    const d = spot.r * (0.92 + Math.pow(r(), 2.2) * reach);
    const lx = spot.x + Math.cos(a) * d, lz = spot.z + Math.sin(a) * d;
    // Bigger blocks stay near the face, the small stuff runs out.
    const s = lerp(size[0], size[1], Math.pow(r(), 2.4)) * (1.25 - (d - spot.r * 0.92) / (spot.r * reach + 1e-3) * 0.5);
    const y = P.ground(lx, lz) - s * 0.2;
    p.set(lx, y, lz);
    e.set((r() - 0.5) * 0.5, r() * Math.PI * 2, (r() - 0.5) * 0.5);
    q.setFromEuler(e);
    sc.set(s * (0.8 + r() * 0.4), s * (0.7 + r() * 0.4), s * (0.8 + r() * 0.4));
    m.compose(p, q, sc);
    lists[Math.floor(r() * geos.length)].push(m.clone());
  }
  geos.forEach((g, k) => {
    if (!lists[k].length) return;
    const im = new THREE.InstancedMesh(g, mat, lists[k].length);
    lists[k].forEach((mm, i) => im.setMatrixAt(i, mm));
    im.castShadow = true;
    im.receiveShadow = true;
    im.computeBoundingSphere();
    recordInstanceBoxes(im);
    P.group.add(im);
  });
}

/* ------------------------------------------------------------------ stones */

function buildStone(lm, ctx) {
  const P = place(lm, ctx);
  const r = rng(lm.seed || 7);
  const R = lm.radius || 4;
  const H = lm.height || 8;
  const segs = ctx.t4 ? 72 : 40;
  const colliders = [];
  const spots = [];

  const column = (lx, lz, opts) => {
    const g = columnGeometry((lm.seed || 7) * 31 + spots.length, { segs, baseY: P.gy + P.ground(lx, lz), ...opts });
    const mesh = new THREE.Mesh(g, ctx.rockMat);
    mesh.position.set(lx, P.ground(lx, lz), lz);
    mesh.rotation.y = r() * Math.PI * 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    P.group.add(mesh);
    const w = P.toWorld(lx, lz);
    const rad = opts.radius * Math.max(...(opts.squash || [1, 1]));
    colliders.push({ x: w.x, z: w.z, radius: rad * 0.95 });
    spots.push({ x: lx, z: lz, r: rad });
  };

  if (lm.asset === 'spire') {
    column(0, 0, { height: H, radius: R, taper: 0.34, waist: 0.2, waistAt: 0.5, cap: 0.16, squash: [1, 0.82], gully: 0.2, plan: 0.22, talus: 0.18, talusSpread: 0.5, notch: 0.05 });
  } else if (lm.asset === 'hoodoos') {
    // Soft stone under a hard cap: each column is a neck of the soft beds with
    // the boulder of harder rock that protected it still balanced on top.
    const n = lm.count || 4;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r() * 0.8;
      const d = i === 0 ? 0 : R * (0.5 + r() * 0.25);
      const rr = R * (i === 0 ? 0.34 : 0.2 + r() * 0.08);
      const hh = H * (i === 0 ? 1 : 0.45 + r() * 0.45);
      const lx = Math.cos(a) * d, lz = Math.sin(a) * d;
      column(lx, lz, {
        height: hh, radius: rr, taper: 0.38, waist: 0.18 + r() * 0.12, waistAt: 0.7 + r() * 0.12, cap: 0.0,
        squash: [1, 0.8 + r() * 0.25], gully: 0.1, ledge: 0.06, plan: 0.2, talus: 0.22, talusSpread: 0.6
      });
      if (r() < 0.85) {
        const capR = rr * (0.95 + r() * 0.4);
        const cap = new THREE.Mesh(boulderGeometry((lm.seed || 7) * 7 + i, { detail: 3, scale: [1, 0.55, 0.85], cuts: 5 }), ctx.rockMat);
        cap.scale.setScalar(capR);
        cap.position.set(lx + (r() - 0.5) * rr * 0.2, P.ground(lx, lz) + hh + capR * 0.12, lz);
        cap.rotation.set((r() - 0.5) * 0.3, r() * Math.PI * 2, (r() - 0.5) * 0.3);
        cap.castShadow = cap.receiveShadow = true;
        P.group.add(cap);
      }
    }
  } else if (lm.asset === 'butte') {
    column(0, 0, { height: H, radius: R, taper: 0.12, cap: 0.1, squash: [1, 0.78], gully: 0.28, ledge: 0.06, plan: 0.26, talus: 0.3, talusSpread: 0.55, notch: 0 });
  } else {  // outcrop: a low, broad ledge of the same beds
    column(0, 0, { height: H, radius: R / 1.6, taper: 0.28, cap: 0.07, squash: [1.6, 0.85], gully: 0.14, ledge: 0.13, notch: 0.2, plan: 0.3 });
  }
  scree(P, ctx.rockMat, (lm.seed || 7) ^ 0x5c, spots, { count: ctx.t4 ? Math.round(18 + R * 7) : 16, reach: 0.5, size: [0.1, Math.min(1.1, R * 0.16)] });
  return { group: P.group, colliders };
}

function buildBoulders(lm, ctx) {
  const P = place(lm, ctx);
  const r = rng(lm.seed || 3);
  const R = lm.radius || 4;
  const colliders = [];
  const spots = [];
  const n = lm.count || 6;
  const placed = [];
  for (let i = 0; i < n * 4 && placed.length < n; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R * 0.7;
    const lx = Math.cos(a) * d, lz = Math.sin(a) * d;
    const s = 0.9 + Math.pow(r(), 1.5) * 1.8;
    if (placed.some(b => Math.hypot(b.x - lx, b.z - lz) < (b.s + s) * 1.05)) continue;
    placed.push({ x: lx, z: lz, s });
    const g = boulderGeometry((lm.seed || 3) * 97 + i, { detail: ctx.t4 ? 3 : 2, scale: [1, 0.66 + r() * 0.25, 0.9 + r() * 0.2], cuts: 5 });
    const mesh = new THREE.Mesh(g, ctx.rockMat);
    mesh.scale.setScalar(s);
    mesh.position.set(lx, P.ground(lx, lz) - s * 0.05, lz);
    mesh.rotation.set((r() - 0.5) * 0.3, r() * Math.PI * 2, (r() - 0.5) * 0.3);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    P.group.add(mesh);
    const w = P.toWorld(lx, lz);
    colliders.push({ x: w.x, z: w.z, radius: s * 0.95 });
    spots.push({ x: lx, z: lz, r: s * 1.05 });
  }
  scree(P, ctx.rockMat, (lm.seed || 3) ^ 0x77, spots, { count: ctx.t4 ? 40 : 14, reach: 0.9, size: [0.08, 0.45] });
  return { group: P.group, colliders };
}

function buildArch(lm, ctx) {
  const span = lm.span || 18;
  const rise = lm.height || 12;
  const thick = 2.7;
  const c = Math.cos(lm.rotY || 0), s = Math.sin(lm.rotY || 0);
  const legs = [-1, 1].map(k => ({ x: lm.pos[0] + k * span / 2 * c, z: lm.pos[2] - k * span / 2 * s }));
  const gy = Math.min(...legs.map(l => ctx.heightAt(l.x, l.z)));
  const P = place(lm, ctx, gy);
  const geo = archGeometry(lm.seed || 5, { span, rise, thick, depth: 3.8, baseY: gy, bury: 3.2 });
  const mesh = new THREE.Mesh(geo, ctx.rockMat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  P.group.add(mesh);
  const colliders = legs.map(l => ({ x: l.x, z: l.z, radius: thick * 1.25 }));
  scree(P, ctx.rockMat, (lm.seed || 5) ^ 0x3a, [
    { x: -span / 2, z: 0, r: thick * 1.5 }, { x: span / 2, z: 0, r: thick * 1.5 }
  ], { count: ctx.t4 ? 60 : 20, reach: 0.9, size: [0.1, 0.8] });
  // Blocks that fell from the underside of the span lie under it.
  const r = rng((lm.seed || 5) ^ 0x91);
  const fallen = [];
  for (let i = 0; i < 3; i++) {
    const lx = (r() - 0.5) * span * 0.5, lz = (r() - 0.5) * 2.2;
    const sz = 0.7 + r() * 0.6;
    fallen.push({ x: lx, z: lz, r: sz });
    const b = new THREE.Mesh(boulderGeometry((lm.seed || 5) * 13 + i, { detail: 2, scale: [1.2, 0.6, 0.9] }), ctx.rockMat);
    b.scale.setScalar(sz);
    b.position.set(lx, P.ground(lx, lz) - 0.05, lz);
    b.rotation.y = r() * 6.28;
    b.castShadow = b.receiveShadow = true;
    P.group.add(b);
    const w = P.toWorld(lx, lz);
    colliders.push({ x: w.x, z: w.z, radius: sz });
  }
  return { group: P.group, colliders };
}

/* ---------------------------------------------------------------- skeleton */

function boneMaterial(ctx) {
  // Bone that has lain out for a century: bleached, cracked along its length,
  // stained where it met the sand.
  const mat = new THREE.MeshStandardMaterial({
    color: 0xfff4de, roughness: 0.8, metalness: 0.0,
    map: ctx.rockDetail.map,
    normalMap: ctx.rockDetail.normalMap, normalScale: new THREE.Vector2(0.6, 0.6)
  });
  mat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      #ifdef USE_MAP
        vec3 bTex = texture2D(map, vMapUv).rgb;
        float bL = dot(bTex, vec3(0.33));
        diffuseColor.rgb *= mix(vec3(0.62, 0.55, 0.45), vec3(1.0, 0.96, 0.88), smoothstep(0.15, 0.55, bL));
      #endif`);
  };
  mat.customProgramCacheKey = () => 'erebus-bone';
  return mat;
}

/** A vertebra: a rounded body with a spine and two processes, all one stone. */
let VERT_GEO = null;
function vertebraGeometry() {
  if (VERT_GEO) return VERT_GEO;
  const body = boulderGeometry(0xb0e, { detail: 2, scale: [0.55, 0.62, 0.62], cuts: 2, rough: 0.25 });
  const spine = taperedTube([
    new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(-0.12, 0.75, 0), new THREE.Vector3(-0.3, 1.2, 0)
  ], 0.16, 0.05, { radial: 7, segs: 8, knob: 0.1 });
  const procL = taperedTube([
    new THREE.Vector3(0, 0, 0.3), new THREE.Vector3(0.05, 0.08, 0.75), new THREE.Vector3(0.12, -0.05, 1.05)
  ], 0.11, 0.04, { radial: 6, segs: 6 });
  const procR = taperedTube([
    new THREE.Vector3(0, 0, -0.3), new THREE.Vector3(0.05, 0.08, -0.75), new THREE.Vector3(0.12, -0.05, -1.05)
  ], 0.11, 0.04, { radial: 6, segs: 6 });
  const parts = [body, spine, procL, procR].map(g => {
    const n = g.index ? g.toNonIndexed() : g;
    if (!n.attributes.uv) n.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2));
    for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(k)) n.deleteAttribute(k);
    n.computeVertexNormals();
    return n;
  });
  VERT_GEO = BufferGeometryUtils.mergeGeometries(parts, false);
  VERT_GEO.computeVertexNormals();
  return VERT_GEO;
}

function buildSkeleton(lm, ctx) {
  const P = place(lm, ctx);
  const r = rng(lm.seed || 83);
  const mat = boneMaterial(ctx);
  const colliders = [];
  const G = P.ground;

  // The spine, sunk along the ground and snaking a little, tail to skull (+x).
  const spineAt = (x) => {
    const z = 1.3 * Math.sin(x * 0.16 + 0.4);
    const lift = x < -9 ? lerp(-0.4, 0.3, (x + 13) / 4) : x > 8 ? lerp(0.45, 0.2, (x - 8) / 4) : 0.45;
    return new THREE.Vector3(x, G(x, z) + lift, z);
  };

  for (let x = -12.5; x <= 9.5; x += 0.72) {
    const p = spineAt(x);
    const big = Math.max(0.3, 1 - Math.abs(x + 1) / 13);
    const vb = new THREE.Mesh(vertebraGeometry(), mat);
    vb.position.copy(p);
    vb.scale.setScalar(big);
    // Each one sits a little askew of the last: the ligaments went long ago.
    vb.rotation.set((r() - 0.5) * 0.35, (r() - 0.5) * 0.25, (r() - 0.5) * 0.2);
    P.group.add(vb);
    if (Math.round((x + 12.5) / 0.72) % 3 === 0) {
      const w = P.toWorld(p.x, p.z);
      colliders.push({ x: w.x, z: w.z, radius: 0.45 });
    }
  }

  // The ribs, rising out of the sand either side and arching in over the spine.
  for (let x = -6.2; x <= 4.6; x += 0.9) {
    const p = spineAt(x);
    const along = (x + 0.8) / 5.6;
    const h = 5.2 - 2.4 * along * along;
    const w = 3.6 - 1.0 * along * along;
    for (const sd of [-1, 1]) {
      if (r() < 0.18) continue;                      // lost
      const broken = r() < 0.4 ? 0.35 + r() * 0.45 : 1;
      // The carcass settled onto one side: ribs on that side splay lower.
      const lean = sd > 0 ? 1.0 : 0.82;
      const pts = [
        new THREE.Vector3(p.x, p.y, p.z + sd * 0.3),
        new THREE.Vector3(p.x - 0.1, p.y + 0.45, p.z + sd * 1.8),
        new THREE.Vector3(p.x - 0.3, p.y + h * 0.55 * lean, p.z + sd * w),
        new THREE.Vector3(p.x - 0.55, p.y + h * 0.9 * lean, p.z + sd * w * 0.92),
        new THREE.Vector3(p.x - 0.8, p.y + h * lean, p.z + sd * w * 0.66)
      ];
      let used = pts;
      if (broken < 1) {
        const c = new THREE.CatmullRomCurve3(pts);
        used = [0, 0.25, 0.5, 0.75, 1].map(t => c.getPointAt(t * broken));
      }
      const g = taperedTube(used, 0.2, broken < 1 ? 0.12 : 0.05, { radial: 8, segs: 26, seed: x * 3 + sd });
      P.group.add(new THREE.Mesh(g, mat));
      const base = pts[1];
      const wb = P.toWorld(base.x, base.z);
      colliders.push({ x: wb.x, z: wb.z, radius: 0.3 });
    }
  }

  // The skull, jaw-down in the sand at the head end: a heavy cranium, a long
  // snout running into the dune, heavy brow ridges shading the eyes, and horns
  // swept back along the neck.
  const sp = spineAt(10.2);
  const skullY = G(11.4, sp.z) + 0.55;
  const cranium = new THREE.Mesh(boulderGeometry(0x5a11, { detail: 3, scale: [1.5, 0.95, 1.15], cuts: 3, rough: 0.3 }), mat);
  cranium.position.set(11.2, skullY, sp.z);
  cranium.rotation.set(0.05, 0.1, -0.12);
  P.group.add(cranium);
  const snout = taperedTube([
    new THREE.Vector3(12.0, skullY + 0.1, sp.z),
    new THREE.Vector3(13.1, skullY - 0.15, sp.z + 0.05),
    new THREE.Vector3(14.2, G(14.2, sp.z) + 0.15, sp.z + 0.1)
  ], 0.72, 0.34, { radial: 12, segs: 16, knob: 0.12, seed: 4 });
  P.group.add(new THREE.Mesh(snout, mat));
  for (const sd of [-1, 1]) {
    const brow = new THREE.Mesh(boulderGeometry(0x5b20 + sd, { detail: 2, scale: [0.55, 0.22, 0.3], cuts: 2, rough: 0.2 }), mat);
    brow.position.set(12.0, skullY + 0.55, sp.z + sd * 0.62);
    brow.rotation.y = sd * 0.3;
    P.group.add(brow);
    // The lower jaw, sunk to the teeth.
    const jaw = taperedTube([
      new THREE.Vector3(11.0, G(11.0, sp.z + sd * 0.7) + 0.05, sp.z + sd * 0.7),
      new THREE.Vector3(12.6, G(12.6, sp.z + sd * 0.55) + 0.02, sp.z + sd * 0.55),
      new THREE.Vector3(14.0, G(14.0, sp.z + sd * 0.35) - 0.05, sp.z + sd * 0.35)
    ], 0.2, 0.12, { radial: 8, segs: 10, seed: 7 + sd });
    P.group.add(new THREE.Mesh(jaw, mat));
    const base = new THREE.Vector3(10.6, skullY + 0.6, sp.z + sd * 0.6);
    const horn = taperedTube([
      base,
      base.clone().add(new THREE.Vector3(-0.7, 0.7, sd * 0.45)),
      base.clone().add(new THREE.Vector3(-1.8, 1.05, sd * 0.8)),
      base.clone().add(new THREE.Vector3(-2.8, 0.85, sd * 0.95))
    ], 0.22, 0.02, { radial: 8, segs: 20, knob: 0.04 });
    P.group.add(new THREE.Mesh(horn, mat));
  }
  for (const lx of [11.2, 13.2]) {
    const ws = P.toWorld(lx, sp.z);
    colliders.push({ x: ws.x, z: ws.z, radius: 1.3 });
  }

  P.group.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  mergeStatic(P.group);
  return { group: P.group, colliders };
}

/* ------------------------------------------------------------------- wreck */

function buildWreck(lm, ctx) {
  const P = place(lm, ctx);
  const r = rng(lm.seed || 97);
  // Decades out here: the paint is mostly gone and what is left is chalk.
  const hullMat = hullMaterial({ tint: '#a39180', grade: 'heavy', dust: 0.85, sharp: [0.3, 0.75], side: THREE.DoubleSide });
  const ribMat = new THREE.MeshStandardMaterial({ color: 0x3a2e26, roughness: 0.9, metalness: 0.55 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x14100d, roughness: 0.95, metalness: 0.2, side: THREE.DoubleSide });
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x1a1613, roughness: 0.95 });
  const colliders = [];

  const W = 8.6, Y0 = 0, Y1 = 6.2;
  const sec = (z, k = 1) => ({ z, pts: frame(W * k, Y0 + (1 - k) * 1.2, Y1 * (0.55 + 0.45 * k), 1.4 * k, 1.1 * k) });

  // The bow half: nose into the dune, rolled on its side.
  const bow = new THREE.Group();
  bow.add(new THREE.Mesh(loft([sec(1.5), sec(6), sec(10, 0.86), sec(12.5, 0.6), sec(14, 0.28)], { capStart: false, uvScale: 0.14 }), hullMat));
  bow.position.set(0, -1.9, 0);
  bow.rotation.set(-0.07, 0, 0.32);
  P.group.add(bow);

  // The aft half, broken off and lying at an angle to it.
  const aft = new THREE.Group();
  aft.add(new THREE.Mesh(loft([sec(-13, 0.8), sec(-11), sec(-5), sec(-3.2)], { capEnd: false, uvScale: 0.14 }), hullMat));
  // Its engine: a bell twice a man's height, half full of sand.
  const bell = new THREE.Mesh(new THREE.LatheGeometry([
    new THREE.Vector2(1.2, 0), new THREE.Vector2(1.5, -0.6), new THREE.Vector2(2.2, -1.8), new THREE.Vector2(2.6, -2.6)
  ].map(v => new THREE.Vector2(v.x, v.y)), 28), ribMat);
  bell.rotation.x = Math.PI / 2;
  bell.position.set(0, 2.6, -13.1);
  aft.add(bell);
  // A tail fin, snapped at the root and still standing, canted.
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.35, 4.2, 5.5), hullMat);
  fin.position.set(0.4, Y1 + 1.6, -10.2);
  fin.rotation.set(0.35, 0, 0.12);
  aft.add(fin);
  // An engine pod torn half off its pylon, hanging on the flank.
  const pod = new THREE.Mesh(new THREE.LatheGeometry([
    new THREE.Vector2(0.001, -4.5), new THREE.Vector2(1.2, -4.5), new THREE.Vector2(1.5, -3.6), new THREE.Vector2(1.6, 2.4),
    new THREE.Vector2(1.45, 3.2), new THREE.Vector2(1.1, 3.4)
  ], 24), hullMat);
  pod.rotation.x = Math.PI / 2;
  pod.position.set(W / 2 + 1.3, 1.4, -7.5);
  pod.rotation.z = 0.15;
  aft.add(pod);
  const podBell = new THREE.Mesh(new THREE.LatheGeometry([
    new THREE.Vector2(1.1, 0), new THREE.Vector2(1.35, -0.6), new THREE.Vector2(1.7, -1.4)
  ], 24), ribMat);
  podBell.rotation.x = -Math.PI / 2;
  podBell.position.set(W / 2 + 1.3, 1.4, -12.0);
  aft.add(podBell);
  aft.position.set(0.8, -1.6, -1.2);
  aft.rotation.set(0.05, 0.28, -0.22);
  P.group.add(aft);

  // The flight deck on the bow: a raised house with its glazing gone dark,
  // mullions still standing, and a bent sensor mast.
  const house = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.5, 3.6), hullMat);
  house.position.set(0, Y1 + 0.6, 9.2);
  bow.add(house);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.7, 0.06), darkMat);
  glass.position.set(0, Y1 + 0.75, 11.02);
  bow.add(glass);
  for (let i = -2; i <= 2; i++) {
    const mull = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.12), ribMat);
    mull.position.set(i * 0.95, Y1 + 0.75, 11.05);
    bow.add(mull);
  }
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 3.2, 6), ribMat);
  mast.position.set(1.2, Y1 + 2.6, 8.6);
  mast.rotation.set(0.5, 0, -0.6);
  bow.add(mast);

  // Across the break: the frames the plating tore off, standing like ribs.
  for (let z = -2.6; z <= 1.1; z += 0.9) {
    const pts = frame(W * 0.98, Y0, Y1, 1.4, 1.1);
    const k = (z + 2.6) / 3.7;
    for (let i = 0; i < pts.length; i++) {
      if (r() < 0.3) continue;                        // bent away, gone
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const seg = new THREE.Mesh(new THREE.BoxGeometry(0.22, len, 0.3), ribMat);
      seg.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 1.75, z);
      seg.rotation.z = Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.PI / 2;
      const hold = new THREE.Group();
      hold.rotation.z = lerp(0.32, -0.22, k);
      hold.add(seg);
      P.group.add(hold);
    }
  }
  // Loose cable spilling out of the break onto the sand.
  for (let i = 0; i < 5; i++) {
    const x0 = (r() - 0.5) * 5, y0 = 1.2 + r() * 2.5;
    const end = [x0 + (r() - 0.5) * 3, P.ground(x0, 0) + 0.05, (r() - 0.5) * 2];
    P.group.add(cableRun([x0, y0, (r() - 0.5) * 2], end, cableMat, { sag: 0.6, radius: 0.04 + r() * 0.03, segments: 12 }));
  }
  // Plating the wind and the fall stripped off, lying about.
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2, d = 8 + r() * 7;
    const lx = Math.cos(a) * d, lz = Math.sin(a) * d * 1.3;
    const w = 0.8 + r() * 1.8, l = 1 + r() * 2.4;
    const plate = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, l), hullMat);
    plate.position.set(lx, P.ground(lx, lz) + 0.02 + r() * 0.1, lz);
    plate.rotation.set((r() - 0.5) * 0.35, r() * Math.PI, (r() - 0.5) * 0.35);
    P.group.add(plate);
  }
  // The dark inside of the hull, seen through the break.
  const inner = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.8, Y1 * 0.8), darkMat);
  inner.position.set(0, 1.2, 1.4);
  inner.rotation.z = 0.32;
  P.group.add(inner);

  P.group.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  mergeStatic(P.group);

  for (const lz of [-11, -7, -3, 1.5, 5.5, 9.5, 12.5]) {
    const w = P.toWorld(0, lz);
    colliders.push({ x: w.x, z: w.z, radius: lz > 11 ? 2.6 : 4.3 });
  }
  return { group: P.group, colliders };
}

export function buildLandmark(lm, ctx) {
  switch (lm.asset) {
    case 'spire':
    case 'hoodoos':
    case 'butte':
    case 'outcrop':
      return buildStone(lm, ctx);
    case 'boulders':
      return buildBoulders(lm, ctx);
    case 'arch':
      return buildArch(lm, ctx);
    case 'skeleton':
      return buildSkeleton(lm, ctx);
    case 'wreck':
      return buildWreck(lm, ctx);
    default:
      return null;
  }
}
