/**
 * bellows/props.js — Everything that stands on the deck but is not a bench.
 *
 * The Compressor at the middle, the gasholders and scoop pylons and vent stacks
 * of the gas works standing off outside the ring of benches, the pipe racks and
 * crate stacks somebody left, a bladder moored in its cradle, the work-lamp road,
 * the comms mast and the pad the Avalon lands on. Each builder takes the world's
 * `ctx` (its materials, its `own()` and its lamp list) and returns ONE group in the
 * landmark's own frame, so the overlap check can measure it as the single object
 * it is and `mergeStatic` can bake it into a draw call or two.
 *
 * ONLY LAMPS ARE LIT. A lamp is a `lampMark` the world pools into three real
 * lights, and the glass round it is the one emissive thing; nothing here owns a
 * PointLight. A moving part (the Compressor's rod and flywheel) is tagged
 * `userData.mover` and protected from the bake, and is the only thing in the
 * world, with the cloud and the plumes, that moves of its own accord.
 *
 * Every footprint here is inside the radius the layout generator reserved for it
 * (`tools/gen-bellows-layout.mjs`), and `verify:bellows` measures the built result
 * to prove it.
 */

import * as THREE from 'three';
import { placard } from '../materials/pbr-kit.js';

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
 * The machine at the middle of the deck: a plinth, a ribbed block, four cylinder
 * heads, a housing with a crown, a piston rod that strokes, a flywheel that turns
 * and an exhaust stack. It is a landmark here and a boss in `boss-compressor.js`;
 * what stands on the deck is the same machine the player will face in the well.
 * Footprint 12 m.
 */
export function buildCompressorTower(ctx) {
  const g = new THREE.Group();
  g.userData.vents = [];

  const plinth = part(ctx, new THREE.CylinderGeometry(11.4, 11.8, 1.1, 8), ctx.M.darkSteel, 0, 0.55, 0, { cast: true });
  plinth.rotation.y = Math.PI / 8;
  g.add(plinth);
  const block = part(ctx, new THREE.CylinderGeometry(7.0, 7.6, 14, 28), ctx.M.steel, 0, 8.1, 0, { cast: true });
  g.add(block);
  for (const y of [3.5, 7.5, 11.5, 15.0]) {
    put(g, part(ctx, new THREE.TorusGeometry(7.3, 0.28, 6, 36), ctx.M.darkSteel, 0, y + 1.1, 0), Math.PI / 2, 0, 0);
  }
  // Four cylinder heads on the diagonals: horizontal barrels with a cap and a rod stub.
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (k * Math.PI) / 2;
    const cx = Math.sin(a), cz = Math.cos(a);
    const barrel = part(ctx, new THREE.CylinderGeometry(2.1, 2.1, 4.2, 18), ctx.M.steel, cx * 9.2, 8.6, cz * 9.2, { cast: true });
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
  const housing = part(ctx, new THREE.CylinderGeometry(3.6, 4.3, 9, 22), ctx.M.steel, 0, 19.6, 0, { cast: true });
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

/** A spherical gasholder on six legs, with a girder ring, an equator band and a manway. Footprint 6.5 m. */
export function buildGasholder(ctx, rotY = 0) {
  const g = new THREE.Group();
  const R = 5.2;
  const cy = 8.3;
  const sphere = part(ctx, new THREE.SphereGeometry(R, 28, 20), ctx.M.cladding, 0, cy, 0, { cast: true });
  g.add(sphere);
  put(g, part(ctx, new THREE.TorusGeometry(R + 0.04, 0.17, 6, 40), ctx.M.darkSteel, 0, cy, 0), Math.PI / 2, 0, 0);
  for (const dy of [-2.6, 2.6]) {
    const rr = Math.sqrt(R * R - dy * dy);
    put(g, part(ctx, new THREE.TorusGeometry(rr + 0.03, 0.1, 5, 36), ctx.M.darkSteel, 0, cy + dy, 0), Math.PI / 2, 0, 0);
  }
  g.add(part(ctx, new THREE.CylinderGeometry(0.7, 0.8, 0.6, 12), ctx.M.steel, 0, cy + R + 0.1, 0));
  const legR = 3.9;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.2;
    g.add(between(ctx, [Math.cos(a) * legR, 0, Math.sin(a) * legR], [Math.cos(a) * legR * 0.9, cy - 3.4, Math.sin(a) * legR * 0.9], 0.2, ctx.M.steel));
    g.add(part(ctx, new THREE.BoxGeometry(0.9, 0.16, 0.9), ctx.M.darkSteel, Math.cos(a) * legR, 0.08, Math.sin(a) * legR));
  }
  put(g, part(ctx, new THREE.TorusGeometry(legR * 0.92, 0.12, 5, 30), ctx.M.darkSteel, 0, 4.6, 0), Math.PI / 2, 0, 0);
  // A caged ladder up the side.
  g.add(part(ctx, new THREE.BoxGeometry(0.05, cy + 1.4, 0.05), ctx.M.darkSteel, R * 0.95, (cy + 1.4) / 2, 0));
  g.add(part(ctx, new THREE.BoxGeometry(0.05, cy + 1.4, 0.05), ctx.M.darkSteel, R * 0.95, (cy + 1.4) / 2, 0.5));
  g.rotation.y = rotY;
  return g;
}

/** A tall lattice mast with a scoop at its head, set to take in the thin air. Footprint 2 m. */
export function buildScoopPylon(ctx, rotY = 0) {
  const g = new THREE.Group();
  const H = 26;
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    g.add(between(ctx, [sx * 1.35, 0, sz * 1.35], [sx * 0.35, H, sz * 0.35], 0.09, ctx.M.steel));
  }
  for (let k = 1; k <= 8; k++) {
    const y = (k / 9) * H;
    const w = 1.35 - (k / 9) * 1.0;
    for (const ry of [0, Math.PI / 2]) {
      const bar = new THREE.Mesh(ctx.own(new THREE.BoxGeometry(w * 2, 0.07, 0.07)), ctx.M.darkSteel);
      bar.position.y = y;
      bar.rotation.y = ry;
      g.add(bar);
    }
  }
  g.add(part(ctx, new THREE.BoxGeometry(3.2, 0.3, 3.2), ctx.M.darkSteel, 0, 0.15, 0));
  // The scoop: half a pipe, mouth into the wind.
  const scoop = part(ctx, new THREE.CylinderGeometry(1.0, 0.55, 2.6, 14, 1, true, 0, Math.PI * 1.2), ctx.M.brass, 0.6, H + 1.0, 0, { cast: true });
  scoop.material.side = THREE.DoubleSide;
  scoop.rotation.z = Math.PI / 2 - 0.35;
  g.add(scoop);
  g.add(part(ctx, new THREE.SphereGeometry(0.3, 8, 6), ctx.M.darkSteel, 0, H + 0.3, 0));
  g.rotation.y = rotY;
  return g;
}

/** A run of three pipes on four trestles, high enough to walk under. Footprint 8 m. */
export function buildPipeRack(ctx, rotY = 0) {
  const g = new THREE.Group();
  const Lh = 6.2;
  for (const x of [-Lh, -Lh / 3, Lh / 3, Lh]) {
    for (const z of [-1.5, 1.5]) g.add(part(ctx, new THREE.BoxGeometry(0.22, 3.3, 0.22), ctx.M.steel, x, 1.65, z, { cast: true }));
    g.add(part(ctx, new THREE.BoxGeometry(0.28, 0.22, 3.4), ctx.M.darkSteel, x, 3.42, 0));
    g.add(between(ctx, [x, 0.4, -1.5], [x, 3.2, 1.5], 0.05, ctx.M.darkSteel));
    for (const z of [-1.5, 1.5]) g.add(part(ctx, new THREE.BoxGeometry(0.7, 0.12, 0.7), ctx.M.darkSteel, x, 0.06, z));
  }
  for (const [z, r] of [[-0.95, 0.36], [0, 0.46], [0.95, 0.36]]) {
    const pipe = part(ctx, new THREE.CylinderGeometry(r, r, Lh * 2 + 1.2, 14), ctx.M.cladding, 0, 3.55 + r, z, { cast: true });
    pipe.rotation.z = Math.PI / 2;
    g.add(pipe);
    for (const x of [-Lh * 0.55, 0, Lh * 0.55]) {
      const fl = part(ctx, new THREE.CylinderGeometry(r + 0.08, r + 0.08, 0.1, 14), ctx.M.darkSteel, x, 3.55 + r, z);
      fl.rotation.z = Math.PI / 2;
      g.add(fl);
    }
  }
  g.rotation.y = rotY;
  return g;
}

/** A vent stack with collars; its plume is the effects layer's, from the mouth. Footprint 2.6 m. */
export function buildVentStack(ctx) {
  const g = new THREE.Group();
  g.userData.vents = [];
  const H = 18;
  g.add(part(ctx, new THREE.CylinderGeometry(0.75, 1.3, H, 14), ctx.M.darkSteel, 0, H / 2, 0, { cast: true }));
  for (const y of [3, 8, 13]) put(g, part(ctx, new THREE.TorusGeometry(0.98 - y * 0.02, 0.1, 5, 18), ctx.M.steel, 0, y, 0), Math.PI / 2, 0, 0);
  g.add(part(ctx, new THREE.CylinderGeometry(1.1, 0.8, 0.5, 14), ctx.M.steel, 0, H + 0.2, 0));
  g.add(part(ctx, new THREE.BoxGeometry(2.4, 0.3, 2.4), ctx.M.darkSteel, 0, 0.15, 0));
  g.userData.vents.push([0, H + 0.6, 0]);
  return g;
}

/** A stack of freight crates with a stencil, left where they were set down. Footprint 2.6 m. */
export function buildCrateStack(ctx, rotY = 0, seed = 1) {
  const g = new THREE.Group();
  const r = rng(seed * 313 + 11);
  const boxes = [[1.2, 0, 0, 1.9, 1.2, 1.3], [-0.5, 0, 0.6, 1.4, 1.2, 1.4], [0.4, 1.2, 0, 1.5, 1.0, 1.2]];
  for (const [x, y, z, w, h, d] of boxes) {
    const c = part(ctx, new THREE.BoxGeometry(w, h, d), ctx.M.crate, x * 0.5, y + h / 2, z * 0.5, { cast: true });
    c.rotation.y = (r() - 0.5) * 0.3;
    g.add(c);
    put(g, part(ctx, new THREE.BoxGeometry(w + 0.04, 0.06, d + 0.04), ctx.M.darkSteel, x * 0.5, y + 0.03, z * 0.5), 0, c.rotation.y, 0);
    put(g, part(ctx, new THREE.BoxGeometry(w + 0.04, 0.06, d + 0.04), ctx.M.darkSteel, x * 0.5, y + h - 0.03, z * 0.5), 0, c.rotation.y, 0);
  }
  g.rotation.y = rotY;
  return g;
}

/**
 * A gas bladder in its cradle: a big skinned bag, strapped down, with its brass
 * valve on top. It is somebody's spare, moored and slack, and the same thing the
 * benches' spoil is made of. Footprint 3.8 m.
 */
export function buildMooredBladder(ctx, rotY = 0) {
  const g = new THREE.Group();
  for (const x of [-2.1, 2.1]) {
    g.add(part(ctx, new THREE.BoxGeometry(0.35, 1.0, 2.6), ctx.M.darkSteel, x, 0.5, 0, { cast: true }));
  }
  g.add(part(ctx, new THREE.BoxGeometry(4.8, 0.2, 2.6), ctx.M.darkSteel, 0, 0.1, 0));
  const bag = part(ctx, new THREE.SphereGeometry(1, 22, 16), ctx.M.skin, 0, 1.9, 0, { cast: true });
  bag.scale.set(3.0, 1.9, 1.7);
  g.add(bag);
  for (const x of [-1.2, 0, 1.2]) {
    const rr = Math.sqrt(Math.max(0.05, 1 - (x / 3.0) ** 2));
    const strap = part(ctx, new THREE.TorusGeometry(1, 0.045, 5, 30), ctx.M.darkSteel, x, 1.9, 0);
    strap.scale.set(1.7 * rr, 1.9 * rr, 1);
    strap.rotation.y = Math.PI / 2;
    g.add(strap);
  }
  g.add(part(ctx, new THREE.CylinderGeometry(0.16, 0.2, 0.4, 10), ctx.M.brass, 0, 3.9, 0));
  g.add(part(ctx, new THREE.CylinderGeometry(0.11, 0.11, 0.3, 8), ctx.M.brass, 0, 4.2, 0));
  g.rotation.y = rotY;
  return g;
}

/* ------------------------------------------------------------- the lamp road */

/**
 * One work lamp: a pole, an arm and a caged filament lamp. The glass is the one
 * emissive thing; the light is a `lampMark` the world pools.
 */
export function buildLampPost(ctx, index = 0) {
  const g = new THREE.Group();
  const H = 3.4;
  g.add(part(ctx, new THREE.CylinderGeometry(0.05, 0.075, H, 6), ctx.M.darkSteel, 0, H / 2, 0, { cast: true }));
  g.add(part(ctx, new THREE.CylinderGeometry(0.18, 0.22, 0.12, 8), ctx.M.darkSteel, 0, 0.06, 0));
  g.add(part(ctx, new THREE.BoxGeometry(0.55, 0.04, 0.04), ctx.M.darkSteel, 0.27, H - 0.15, 0));
  g.add(part(ctx, new THREE.ConeGeometry(0.17, 0.12, 6), ctx.M.darkSteel, 0.5, H - 0.22, 0));
  g.add(part(ctx, new THREE.CylinderGeometry(0.075, 0.075, 0.26, 8), ctx.M.lantern, 0.5, H - 0.4, 0));
  for (const a of [0, Math.PI / 2]) {
    const cage = part(ctx, new THREE.BoxGeometry(0.2, 0.3, 0.012), ctx.M.darkSteel, 0.5, H - 0.4, 0);
    cage.rotation.y = a;
    g.add(cage);
  }
  const mark = new THREE.Object3D();
  mark.position.set(0.5, H - 0.4, 0);
  mark.userData.lamp = { color: 0xe6a443, intensity: 5, distance: 13, decay: 1.6 };
  g.add(mark);
  ctx.lamps.push(mark);
  g.rotation.y = (index * 2.399) % (Math.PI * 2);
  return g;
}

/* --------------------------------------------------------------- the comms mast */

export function buildCommsMast(ctx) {
  const g = new THREE.Group();
  const H = 20;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    g.add(between(ctx, [Math.cos(a) * 0.55, 0, Math.sin(a) * 0.55], [Math.cos(a) * 0.12, H, Math.sin(a) * 0.12], 0.05, ctx.M.steel));
  }
  for (const y of [H * 0.35, H * 0.62, H * 0.88]) {
    g.add(part(ctx, new THREE.BoxGeometry(2.4 - y * 0.08, 0.05, 0.05), ctx.M.darkSteel, 0, y, 0));
  }
  const dish = part(ctx, new THREE.SphereGeometry(1.1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), ctx.M.steel, 0, H - 2, 0.6);
  dish.rotation.x = Math.PI * 0.55;
  g.add(dish);
  g.add(part(ctx, new THREE.BoxGeometry(1.1, 0.25, 1.1), ctx.M.darkSteel, 0, 0.12, 0));
  return g;
}

/* ----------------------------------------------------------------- the pad */

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
  const mat = ctx.own(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, metalness: 0.35 }));
  const geo = ctx.own(new THREE.CylinderGeometry(R, R, 0.06, 8));
  geo.rotateY(Math.PI / 8);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, 0.5 + pos.getX(i) / (R * 2.2), 0.5 + pos.getZ(i) / (R * 2.2));
  const plate = new THREE.Mesh(geo, mat);
  plate.position.y = 0.03;
  plate.receiveShadow = ctx.t4;
  plate.userData.phys = 'ground';
  g.add(plate);
  // Tie-down rings, flush.
  const ringGeo = ctx.own(new THREE.TorusGeometry(0.22, 0.04, 5, 12));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const ring = new THREE.Mesh(ringGeo, ctx.M.darkSteel);
    ring.position.set(Math.cos(a) * (R - 0.8), 0.07, Math.sin(a) * (R - 0.8));
    ring.rotation.x = -Math.PI / 2;
    ring.userData.phys = 'ground';
    g.add(ring);
  }
  return g;
}

/* ------------------------------------------------------------------ vista */

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
  const geo = ctx.own(new THREE.IcosahedronGeometry(1, 2));
  for (let k = 0; k < count; k++) {
    const a = r() * Math.PI * 2;
    const d = 140 + r() * 400;
    const cx = Math.sin(a) * d, cz = Math.cos(a) * d;
    const size = 26 + r() * 56;
    const puffs = 5 + Math.floor(r() * 5);
    for (let i = 0; i < puffs; i++) {
      const s = size * (0.45 + r() * 0.6);
      const m = new THREE.Mesh(geo, ctx.M.cloud);
      m.position.set(cx + (r() - 0.5) * size * 1.5, seaLevel + s * 0.35 + r() * size * 0.5, cz + (r() - 0.5) * size * 1.5);
      m.scale.set(s, s * (0.55 + r() * 0.3), s);
      g.add(m);
    }
  }
  return g;
}

/** A small stencilled sign, for a bench or a post: the name a player walks toward. */
export function buildSign(ctx, text, { w = 2.4, h = 0.46 } = {}) {
  const sign = placard(text, { w, h, fg: '#14223a', bg: '#d6e0ee' });
  ctx.own(sign.geometry, sign.material, sign.material.map);
  return sign;
}
