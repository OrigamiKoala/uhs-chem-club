/**
 * bellows/plant.js — The working machines that stand in the open and the pieces kept from the first Bellows.
 *
 * The Compressor on top of its plinth (a landmark here and the boss the player fights on the apron in
 * front of it), the pad the Avalon lands on, and the cumulus heads standing out of the cloud sea. Lifted
 * from the old `props.js` (archived in `archive/2026-11-18/site-bellows/`) unchanged.
 *
 * ONLY LAMPS ARE LIT. A moving part (the Compressor's rod and flywheel) is tagged `userData.mover` and held
 * out of the bake; with the cloud and the plumes it is all that moves.
 */

import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const AX = new THREE.Vector3(0, 1, 0);

/** A mesh with its geometry owned, positioned, shadowed at T4. */
function part(ctx, geo, mat, x = 0, y = 0, z = 0, { cast = false } = {}) {
  const m = new THREE.Mesh(ctx.own(geo), mat);
  m.position.set(x, y, z);
  if (cast) m.castShadow = m.receiveShadow = ctx.t4;
  return m;
}

/** Add a mesh to a group, turned, and hand the MESH back (Object3D.add returns the parent). */
function put(group, mesh, rx = 0, ry = 0, rz = 0) {
  mesh.rotation.set(rx, ry, rz);
  group.add(mesh);
  return mesh;
}

/** A cylinder laid between two points. */
function between(ctx, a, b, radius, mat) {
  const from = new THREE.Vector3(...a); const to = new THREE.Vector3(...b);
  const len = from.distanceTo(to);
  const m = new THREE.Mesh(ctx.own(new THREE.CylinderGeometry(radius, radius, len, 6)), mat);
  m.position.copy(from).lerp(to, 0.5);
  m.quaternion.setFromUnitVectors(AX, to.clone().sub(from).normalize());
  return m;
}

/* ------------------------------------------------------------ the Compressor */

/**
 * Lay a round body's uvs in metres (`tile` m per repeat, a whole number of repeats round it, so the seam meets),
 * so a plate texture is the same size on the Compressor as on the decks rather than stretched round 44 m.
 * `v` follows height. Works for CylinderGeometry and LatheGeometry (both run u 0..1 round the axis).
 */
function metricRoundUV(geo, r, tile = 3) {
  const k = Math.max(1, Math.round((2 * Math.PI * r) / tile));
  const uv = geo.attributes.uv, p = geo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * k, p.getY(i) / tile);
  uv.needsUpdate = true;
  return geo;
}

/**
 * A turned body from a profile of `[r, y]` points (bottom to top). Each step of the profile is its own band, so a
 * flange's face, its edge and the body above it keep crisp corners instead of one smoothed bulge.
 */
function turned(profile, seg) {
  const bands = [];
  for (let i = 0; i < profile.length - 1; i++) {
    const [a, b] = [profile[i], profile[i + 1]];
    bands.push(new THREE.LatheGeometry([new THREE.Vector2(a[0], a[1]), new THREE.Vector2(b[0], b[1])], seg));
  }
  const g = mergeGeometries(bands, false);
  for (const b of bands) b.dispose();
  return g;
}

/**
 * The machine at the middle of the deck: a plinth, a ribbed block, four cylinder
 * heads, a housing with a crown, a piston rod that strokes, a flywheel that turns
 * and an exhaust stack. It is a landmark here and a boss in `boss-compressor.js`;
 * what stands on the deck is the same machine the player will face in the well.
 * Footprint 12 m.
 */
export function buildCompressorTower(ctx) {
  const g = new THREE.Group();
  g.userData.vents = [];

  // The octagon's turn is baked into its vertices, so its box is the plinth's own and not the loose box of a turned one.
  const plinthGeo = new THREE.CylinderGeometry(11.4, 11.8, 1.1, 8);
  plinthGeo.rotateY(Math.PI / 8);
  const plinth = part(ctx, plinthGeo, ctx.M.darkSteel, 0, 0.55, 0, { cast: true });
  g.add(plinth);
  // The block: a cast foot flange, the plated body tapering up, a cornice band at its head, a flat top.
  const blockGeo = metricRoundUV(turned([
    [0.01, -7], [7.85, -7], [7.85, -6.62], [7.6, -6.5], [7.0, 6.45], [7.28, 6.55], [7.28, 7], [0.01, 7]
  ], 40), 7.3);
  const block = part(ctx, blockGeo, ctx.M.steel, 0, 8.1, 0, { cast: true });
  g.add(block);
  for (const y of [3.5, 7.5, 11.5, 15.0]) {
    put(g, part(ctx, new THREE.TorusGeometry(7.3, 0.28, 6, 36), ctx.M.darkSteel, 0, y + 1.1, 0), Math.PI / 2, 0, 0);
  }
  // Four cylinder heads on the diagonals: horizontal barrels with a cap and a rod stub.
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (k * Math.PI) / 2;
    const cx = Math.sin(a), cz = Math.cos(a);
    const barrel = part(ctx, metricRoundUV(new THREE.CylinderGeometry(2.1, 2.1, 4.2, 24), 2.1), ctx.M.steel, cx * 9.2, 8.6, cz * 9.2, { cast: true });
    barrel.rotation.set(Math.PI / 2, 0, 0);
    barrel.rotation.order = 'YXZ';
    barrel.rotation.y = a;
    g.add(barrel);
    const cap = part(ctx, new THREE.CylinderGeometry(2.35, 2.35, 0.35, 18), ctx.M.darkSteel, cx * 11.4, 8.6, cz * 11.4);
    cap.rotation.order = 'YXZ';
    cap.rotation.set(Math.PI / 2, a, 0);
    g.add(cap);
    const finGeo = ctx.own(new THREE.TorusGeometry(2.18, 0.1, 5, 20));
    for (const d of [-1.3, -0.4, 0.5, 1.4]) {
      const fin = new THREE.Mesh(finGeo, ctx.M.darkSteel);
      fin.position.set(cx * (9.2 + d), 8.6, cz * (9.2 + d));
      fin.rotation.set(0, a, 0);
      g.add(fin);
    }
  }
  // The housing and its crown.
  // The housing: a bolted flange where it sits on the block, a band at mid-height, a lip under the crown.
  const housingGeo = metricRoundUV(turned([
    [0.01, -4.5], [4.55, -4.5], [4.55, -4.18], [4.3, -4.1], [3.98, 0], [4.12, 0.05], [4.12, 0.4], [3.94, 0.45],
    [3.6, 4.3], [3.78, 4.35], [3.78, 4.5], [0.01, 4.5]
  ], 32), 4);
  const housing = part(ctx, housingGeo, ctx.M.steel, 0, 19.6, 0, { cast: true });
  g.add(housing);
  g.add(part(ctx, new THREE.SphereGeometry(3.6, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), ctx.M.darkSteel, 0, 24.1, 0));
  // The piston rod: it strokes, so it is held out of any bake.
  const rod = part(ctx, new THREE.CylinderGeometry(0.62, 0.62, 12, 12), ctx.M.brass, 0, 31, 0, { cast: true });
  rod.userData.noMerge = true;
  rod.userData.mover = { kind: 'stroke', base: 31, amp: 1.6, rate: 1.9 };
  g.add(rod);
  const guide = part(ctx, new THREE.CylinderGeometry(1.1, 1.1, 2.0, 14), ctx.M.darkSteel, 0, 25.6, 0);
  g.add(guide);
  // The flywheel: a vertical ring on the face the spawn looks at, turning slowly.
  const wheel = new THREE.Group();
  wheel.position.set(0, 9.2, 8.6);
  wheel.userData.noMerge = true;
  wheel.userData.mover = { kind: 'spin', rate: 0.5 };
  const rim = part(ctx, new THREE.TorusGeometry(6.6, 0.55, 8, 40), ctx.M.darkSteel, 0, 0, 0, { cast: true });
  wheel.add(rim);
  const spokeGeo = ctx.own(new THREE.BoxGeometry(13.0, 0.5, 0.5));
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Mesh(spokeGeo, ctx.M.steel);
    s.rotation.z = (i * Math.PI) / 4;
    wheel.add(s);
  }
  put(wheel, part(ctx, new THREE.CylinderGeometry(1.2, 1.2, 1.4, 14), ctx.M.brass, 0, 0, 0), Math.PI / 2, 0, 0);
  g.add(wheel);
  // The exhaust stack, with a plume at its mouth.
  const stack = part(ctx, new THREE.CylinderGeometry(0.9, 1.4, 22, 12), ctx.M.darkSteel, 4.6, 26, -3.2, { cast: true });
  g.add(stack);
  g.add(part(ctx, new THREE.CylinderGeometry(1.15, 1.15, 0.6, 12), ctx.M.steel, 4.6, 37.2, -3.2));
  g.userData.vents.push([4.6, 37.6, -3.2]);
  return g;
}

/* ---------------------------------------------------------------- the works */


/** The pad the Avalon lands on: a painted octagon of plate, flush with the deck. */
export function buildLandingPad(ctx) {
  const g = new THREE.Group();
  const R = 8.4;
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const x = c.getContext('2d');
  x.fillStyle = '#3a4350';
  x.fillRect(0, 0, 512, 512);
  x.strokeStyle = '#b9c4cc';
  x.lineWidth = 12;
  x.beginPath(); x.arc(256, 256, 205, 0, Math.PI * 2); x.stroke();
  x.lineWidth = 6;
  x.beginPath(); x.arc(256, 256, 150, 0, Math.PI * 2); x.stroke();
  x.fillStyle = '#c9a14a';
  x.beginPath(); x.moveTo(256, 120); x.lineTo(320, 250); x.lineTo(256, 215); x.lineTo(192, 250); x.closePath(); x.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  ctx.own(tex);
  const mat = ctx.own(new THREE.MeshStandardMaterial({
    map: tex, roughness: 0.7, metalness: 0.35,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
  }));
  const geo = ctx.own(new THREE.CylinderGeometry(R, R + 0.15, 0.12, 8));
  geo.rotateY(Math.PI / 8);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, 0.5 + pos.getX(i) / (R * 2.2), 0.5 + pos.getZ(i) / (R * 2.2));
  const plate = new THREE.Mesh(geo, mat);
  plate.position.y = 0.06;
  plate.receiveShadow = ctx.t4;
  plate.userData.phys = 'ground';
  g.add(plate);
  // Tie-down rings, flush.
  const ringGeo = ctx.own(new THREE.TorusGeometry(0.22, 0.04, 5, 12));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const ring = new THREE.Mesh(ringGeo, ctx.M.darkSteel);
    ring.position.set(Math.cos(a) * (R - 0.8), 0.13, Math.sin(a) * (R - 0.8));
    ring.rotation.x = -Math.PI / 2;
    ring.userData.phys = 'ground';
    g.add(ring);
  }
  return g;
}

/* ------------------------------------------------------------------ vista */

function h3(ix, iy, iz, seed) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(iz, 2147483647) ^ Math.imul(seed, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function n3(x, y, z, seed) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const L = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => h3(ix + dx, iy + dy, iz + dz, seed);
  return L(L(L(c(0, 0, 0), c(1, 0, 0), u), L(c(0, 1, 0), c(1, 1, 0), u), v),
    L(L(c(0, 0, 1), c(1, 0, 1), u), L(c(0, 1, 1), c(1, 1, 1), u), v), w);
}

/**
 * One puff of cumulus, unit size: a sphere pushed out into rounded billows at two scales, its underside pressed
 * flat (a cumulus has a flat base at its condensation level), smooth-shaded. `seed` makes each puff its own.
 */
export function billowPuff(seed, detail = 4) {
  let g = new THREE.IcosahedronGeometry(1, detail);
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  g = mergeVertices(g);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const d = 1 + (n3(x * 2.1 + 7, y * 2.1, z * 2.1, seed) - 0.5) * 0.36 + (n3(x * 4.7, y * 4.7 + 3, z * 4.7, seed + 9) - 0.5) * 0.16;
    let Y = y * d;
    if (Y < -0.3) Y = -0.3 + (Y + 0.3) * 0.18;
    p.setXYZ(i, x * d, Y, z * d);
  }
  g.computeVertexNormals();
  g.userData.smooth = true;
  return g;
}

/**
 * Cumulus heads standing out of the cloud sea beyond the rail: a few dozen
 * clusters of soft white spheres at 130 to 520 m. They give the eye the parallax a
 * flat sea cannot, and they are ambient: nothing collides with them and the
 * overlap check leaves them alone.
 */
export function buildCloudHeads(ctx, seaLevel, count = 22) {
  const g = new THREE.Group();
  g.name = 'bellows-cloud-heads';
  g.userData.phys = 'ambient';
  const r = rng(0xc10dd);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  for (let k = 0; k < count; k++) {
    const a = r() * Math.PI * 2;
    const d = 140 + r() * 400;
    const cx = Math.sin(a) * d, cz = Math.cos(a) * d;
    const size = 26 + r() * 56;
    const puffs = 5 + Math.floor(r() * 5);
    // One mesh per head, not per puff: a head is culled as a whole and its puffs never move apart.
    const parts = [];
    for (let i = 0; i < puffs; i++) {
      const s = size * (0.45 + r() * 0.6);
      const pos = new THREE.Vector3(cx + (r() - 0.5) * size * 1.5, seaLevel + s * 0.35 + r() * size * 0.5, cz + (r() - 0.5) * size * 1.5);
      const scale = new THREE.Vector3(s, s * (0.55 + r() * 0.3), s);
      const puff = billowPuff(k * 17 + i);
      parts.push(puff.applyMatrix4(m4.compose(pos, q, scale)));
    }
    g.add(new THREE.Mesh(ctx.own(mergeGeometries(parts, false)), ctx.M.cloud));
    for (const p of parts) p.dispose();
  }
  return g;
}
