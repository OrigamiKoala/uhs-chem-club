/**
 * lanternfall/props.js — Everything that stands on the ice but is not a bench.
 *
 * Ice spires, pressure ridges, the aurora masts, the camps somebody left, the
 * comms mast, the lantern road and the pad the Avalon lands on. (The hosts the
 * benches are built into, with the crawler, are `stations.js`.) Each builder takes the world's `ctx` (its materials,
 * its `own()` and its lamp list) and returns ONE group in the landmark's own
 * frame, so the overlap check can measure it as the single object it is and
 * `mergeStatic` can bake it into a draw call or two.
 *
 * ONLY LAMPS ARE LIT. The lanterns, and the amber filament in them, are the
 * only warm light in a world of cold colour; the aurora is a sky and the lake
 * a mirror. A lantern pushes a `lampMark` and never a PointLight (the world
 * pools them: see `lamp-pool.js`).
 *
 * Every footprint here is inside the radius the layout generator reserved for
 * it (`tools/gen-lanternfall-layout.mjs`), and `verify:lanternfall` measures
 * the built result to prove it.
 */

import * as THREE from 'three';

function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A cylinder with its rim jittered, so an ice shard is faceted and not a perfect prism. */
function shardGeometry(rBottom, rTop, h, seed, segs = 6) {
  const g = new THREE.CylinderGeometry(rTop, rBottom, h, segs, 3, false);
  const r = rng(seed);
  const pos = g.attributes.position;
  const jit = new Map();
  for (let i = 0; i < pos.count; i++) {
    const key = `${pos.getX(i).toFixed(3)}|${pos.getY(i).toFixed(3)}|${pos.getZ(i).toFixed(3)}`;
    if (!jit.has(key)) jit.set(key, [(r() - 0.5) * 0.3, (r() - 0.5) * 0.12, (r() - 0.5) * 0.3]);
    const [jx, jy, jz] = jit.get(key);
    const f = (pos.getY(i) + h / 2) / h;     // 0 at the base: the base stays on the ground
    pos.setXYZ(i, pos.getX(i) * (1 + jx * f), pos.getY(i) + jy * f * h * 0.2, pos.getZ(i) * (1 + jz * f));
  }
  g.computeVertexNormals();
  return g;
}

/* ------------------------------------------------------------------ spires */

export function buildIceSpire(ctx, scale = 1, rotY = 0, seed = 1) {
  const g = new THREE.Group();
  const r = rng(seed * 977 + 13);
  const base = 1.1 * scale;
  const h = (7 + r() * 6) * Math.pow(scale, 0.6);
  const main = new THREE.Mesh(ctx.own(shardGeometry(base, base * 0.08, h, seed)), ctx.M.carved);
  main.position.y = h / 2;
  main.rotation.z = (r() - 0.5) * 0.12;
  main.castShadow = main.receiveShadow = ctx.t4;
  g.add(main);
  const shards = 2 + Math.floor(r() * 3);
  for (let i = 0; i < shards; i++) {
    const a = (i / shards) * Math.PI * 2 + r();
    const d = base * (0.9 + r() * 0.5);
    const sh = (h * (0.35 + r() * 0.35));
    const s = new THREE.Mesh(ctx.own(shardGeometry(base * 0.55, base * 0.05, sh, seed + i + 5)), ctx.M.carved);
    s.position.set(Math.cos(a) * d, sh / 2 - 0.05, Math.sin(a) * d);
    s.rotation.set((r() - 0.5) * 0.3, r() * 3, (r() - 0.5) * 0.3);
    s.castShadow = ctx.t4;
    g.add(s);
  }
  // Rime drifted on the lee side.
  const drift = new THREE.Mesh(ctx.own(new THREE.SphereGeometry(base * 1.5, 8, 6)), ctx.M.snow);
  drift.scale.set(1.2, 0.28, 1.0);
  drift.position.set(base * 0.5, 0.0, base * 0.3);
  g.add(drift);
  g.rotation.y = rotY;
  return g;
}

/* ------------------------------------------------------------------ ridges */

export function buildPressureRidge(ctx, scale = 1, rotY = 0, seed = 1) {
  const g = new THREE.Group();
  const r = rng(seed * 733 + 5);
  const n = 6;
  const L = 8.2 * scale;
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1) - 0.5) * L;
    const hgt = 1.0 + r() * 2.4;
    const w = 1.5 + r() * 1.0;
    const slab = new THREE.Mesh(ctx.own(new THREE.BoxGeometry(L / n * 1.3, hgt, w)), ctx.M.carved);
    slab.position.set(t, hgt / 2 - 0.15, (r() - 0.5) * 0.7);
    slab.rotation.set((r() - 0.5) * 0.4, (r() - 0.5) * 0.35, (r() - 0.5) * 0.5);
    slab.castShadow = slab.receiveShadow = ctx.t4;
    g.add(slab);
  }
  const snow = new THREE.Mesh(ctx.own(new THREE.SphereGeometry(1, 8, 5)), ctx.M.snow);
  snow.scale.set(L * 0.5, 0.45, 1.6);
  snow.position.y = 0.05;
  g.add(snow);
  g.rotation.y = rotY;
  return g;
}

/* ------------------------------------------------------------------- masts */

/** An aurora watch mast: a four-legged lattice with a crossbar and a dish at the top. */
export function buildAuroraMast(ctx) {
  const g = new THREE.Group();
  const H = 13.5;
  const legGeo = ctx.own(new THREE.CylinderGeometry(0.05, 0.09, H, 6));
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const leg = new THREE.Mesh(legGeo, ctx.M.steel);
    leg.position.set(sx * 0.62, H / 2, sz * 0.62);
    // Lean the legs in so the mast tapers toward its head.
    leg.rotation.z = -sx * 0.045;
    leg.rotation.x = sz * 0.045;
    leg.castShadow = ctx.t4;
    g.add(leg);
  }
  const ringGeo = ctx.own(new THREE.BoxGeometry(1.1, 0.05, 0.05));
  for (let k = 1; k <= 7; k++) {
    const y = (k / 8) * H;
    const taper = 1 - (k / 8) * 0.5;
    for (const ry of [0, Math.PI / 2]) {
      const bar = new THREE.Mesh(ringGeo, ctx.M.darkSteel);
      bar.scale.x = taper;
      bar.position.set(0, y, 0);
      bar.rotation.y = ry;
      g.add(bar);
    }
  }
  const cross = new THREE.Mesh(ctx.own(new THREE.BoxGeometry(4.0, 0.07, 0.07)), ctx.M.steel);
  cross.position.y = H - 0.6;
  g.add(cross);
  const dish = new THREE.Mesh(ctx.own(new THREE.SphereGeometry(0.7, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2)), ctx.M.steel);
  dish.rotation.x = Math.PI * 0.62;
  dish.position.set(0, H + 0.1, 0);
  g.add(dish);
  const foot = new THREE.Mesh(ctx.own(new THREE.BoxGeometry(1.7, 0.2, 1.7)), ctx.M.darkSteel);
  foot.position.y = 0.1;
  g.add(foot);
  return g;
}

export function buildCommsMast(ctx) {
  const g = new THREE.Group();
  const H = 9;
  const pole = new THREE.Mesh(ctx.own(new THREE.CylinderGeometry(0.06, 0.1, H, 8)), ctx.M.steel);
  pole.position.y = H / 2;
  pole.castShadow = ctx.t4;
  g.add(pole);
  for (const y of [H * 0.45, H * 0.75, H]) {
    const bar = new THREE.Mesh(ctx.own(new THREE.BoxGeometry(2.0 - y * 0.12, 0.05, 0.05)), ctx.M.darkSteel);
    bar.position.y = y - 0.1;
    g.add(bar);
  }
  // Guy lines to three anchors, thin enough to be lines.
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI * 2 / 3 + 0.4;
    const from = new THREE.Vector3(0, H * 0.8, 0);
    const to = new THREE.Vector3(Math.cos(a) * 1.25, 0.1, Math.sin(a) * 1.25);
    const len = from.distanceTo(to);
    const line = new THREE.Mesh(ctx.own(new THREE.CylinderGeometry(0.012, 0.012, len, 4)), ctx.M.darkSteel);
    line.position.copy(from).lerp(to, 0.5);
    line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
    g.add(line);
  }
  const base = new THREE.Mesh(ctx.own(new THREE.BoxGeometry(0.6, 0.3, 0.6)), ctx.M.darkSteel);
  base.position.y = 0.15;
  g.add(base);
  return g;
}

/* ------------------------------------------------------------ the lantern road */

/**
 * One lantern post: a pole, an arm, and a glass lantern with an amber filament.
 * The glass is the one emissive thing; the lamp itself is a `lampMark` the world
 * pools, so no prop in the world ever owns a PointLight.
 */
export function buildLanternPost(ctx, index = 0) {
  const g = new THREE.Group();
  const H = 3.4;
  const pole = new THREE.Mesh(ctx.own(new THREE.CylinderGeometry(0.045, 0.065, H, 6)), ctx.M.darkSteel);
  pole.position.y = H / 2;
  pole.castShadow = ctx.t4;
  g.add(pole);
  const foot = new THREE.Mesh(ctx.own(new THREE.CylinderGeometry(0.16, 0.2, 0.12, 8)), ctx.M.darkSteel);
  foot.position.y = 0.06;
  g.add(foot);
  const arm = new THREE.Mesh(ctx.own(new THREE.BoxGeometry(0.55, 0.04, 0.04)), ctx.M.darkSteel);
  arm.position.set(0.27, H - 0.15, 0);
  g.add(arm);
  const cap = new THREE.Mesh(ctx.own(new THREE.ConeGeometry(0.15, 0.1, 4)), ctx.M.darkSteel);
  cap.position.set(0.5, H - 0.25, 0);
  cap.rotation.y = Math.PI / 4;
  g.add(cap);
  const glass = new THREE.Mesh(ctx.own(new THREE.BoxGeometry(0.17, 0.26, 0.17)), ctx.M.lantern);
  glass.position.set(0.5, H - 0.43, 0);
  g.add(glass);
  const base = new THREE.Mesh(ctx.own(new THREE.BoxGeometry(0.2, 0.03, 0.2)), ctx.M.darkSteel);
  base.position.set(0.5, H - 0.58, 0);
  g.add(base);

  const mark = new THREE.Object3D();
  mark.position.set(0.5, H - 0.43, 0);
  mark.userData.lamp = { color: 0xe6a443, intensity: 6, distance: 14, decay: 1.6 };
  g.add(mark);
  ctx.lamps.push(mark);
  g.rotation.y = (index * 2.399) % (Math.PI * 2);
  return g;
}

/* ------------------------------------------------------------------- camps */

export function buildCamp(ctx, rotY = 0, seed = 1) {
  const g = new THREE.Group();
  const r = rng(seed * 311 + 7);
  // Two A-frame tents, canvas stiff with frost.
  for (const [x, z, s] of [[-1.15, -0.4, 1.0], [1.05, 0.5, 0.85]]) {
    const tent = new THREE.Mesh(ctx.own(new THREE.ConeGeometry(1.25 * s, 1.55 * s, 4)), ctx.M.canvas);
    tent.position.set(x, 0.78 * s, z);
    tent.rotation.y = Math.PI / 4 + (r() - 0.5) * 0.4;
    tent.castShadow = ctx.t4;
    g.add(tent);
  }
  // A supply drum and a crate, left where they were set down.
  const drum = new THREE.Mesh(ctx.own(new THREE.CylinderGeometry(0.3, 0.3, 0.8, 12)), ctx.M.darkSteel);
  drum.position.set(0.2, 0.4, -1.25);
  g.add(drum);
  const crate = new THREE.Mesh(ctx.own(new THREE.BoxGeometry(0.7, 0.5, 0.5)), ctx.M.timber);
  crate.position.set(-0.6, 0.25, 1.1);
  crate.rotation.y = r();
  g.add(crate);
  const mound = new THREE.Mesh(ctx.own(new THREE.SphereGeometry(1.4, 8, 5)), ctx.M.snow);
  mound.scale.set(1.5, 0.22, 1.2);
  mound.position.set(0, 0, 0);
  g.add(mound);
  g.rotation.y = rotY;
  return g;
}

export function buildSled(ctx, rotY = 0) {
  const g = new THREE.Group();
  for (const z of [-0.35, 0.35]) {
    const run = new THREE.Mesh(ctx.own(new THREE.BoxGeometry(1.7, 0.06, 0.07)), ctx.M.timber);
    run.position.set(0, 0.06, z);
    g.add(run);
  }
  const bed = new THREE.Mesh(ctx.own(new THREE.BoxGeometry(1.5, 0.06, 0.85)), ctx.M.timber);
  bed.position.y = 0.14;
  g.add(bed);
  const load = new THREE.Mesh(ctx.own(new THREE.BoxGeometry(0.8, 0.4, 0.6)), ctx.M.canvas);
  load.position.set(0.1, 0.37, 0);
  g.add(load);
  g.rotation.y = rotY;
  return g;
}

export function buildStake(ctx) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(ctx.own(new THREE.CylinderGeometry(0.02, 0.03, 1.3, 5)), ctx.M.darkSteel);
  pole.position.y = 0.65;
  g.add(pole);
  const tag = new THREE.Mesh(ctx.own(new THREE.BoxGeometry(0.16, 0.1, 0.01)), ctx.M.lantern);
  tag.position.set(0.09, 1.2, 0);
  g.add(tag);
  return g;
}

/* --------------------------------------------------------------- the pad */

/** The pad the Avalon lands on: low, wide, painted, and flush with the ice at its bevelled edge. */
export function buildLandingPad(ctx, field) {
  const g = new THREE.Group();
  const R = field.PAD_R;
  const TOP = field.PAD_TOP;

  // The marking: a ring and a chevron, worn.
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const x = c.getContext('2d');
  x.fillStyle = '#4a5560';
  x.fillRect(0, 0, 512, 512);
  x.strokeStyle = '#a9b6bd';
  x.lineWidth = 12;
  x.beginPath(); x.arc(256, 256, 205, 0, Math.PI * 2); x.stroke();
  x.lineWidth = 6;
  x.beginPath(); x.arc(256, 256, 150, 0, Math.PI * 2); x.stroke();
  x.fillStyle = '#c9a14a';
  x.beginPath(); x.moveTo(256, 120); x.lineTo(320, 250); x.lineTo(256, 215); x.lineTo(192, 250); x.closePath(); x.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  ctx.own(tex);

  const deckMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.72, metalness: 0.3 });
  ctx.own(deckMat);
  const prof = [
    new THREE.Vector2(R + 0.6, -0.3), new THREE.Vector2(R + 0.6, -0.04),
    new THREE.Vector2(R + 0.05, TOP - 0.03), new THREE.Vector2(R - 0.02, TOP),
    new THREE.Vector2(0, TOP)
  ];
  const deckGeo = ctx.own(new THREE.LatheGeometry(prof, 8));
  deckGeo.rotateY(Math.PI / 8);
  const dp = deckGeo.attributes.position, duv = deckGeo.attributes.uv;
  for (let i = 0; i < dp.count; i++) duv.setXY(i, 0.5 + dp.getX(i) / (R * 2.2), 0.5 + dp.getZ(i) / (R * 2.2));
  deckGeo.computeVertexNormals();
  const deck = new THREE.Mesh(deckGeo, deckMat);
  deck.receiveShadow = ctx.t4;
  deck.userData.phys = 'ground';
  g.add(deck);

  // Flush perimeter lamps, dark: the pad is cold.
  const lampGeo = ctx.own(new THREE.BoxGeometry(0.2, 0.03, 0.2));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const lamp = new THREE.Mesh(lampGeo, ctx.M.lantern);
    lamp.position.set(Math.cos(a) * (R - 0.6), TOP + 0.005, Math.sin(a) * (R - 0.6));
    lamp.rotation.y = -a;
    g.add(lamp);
  }
  return g;
}
