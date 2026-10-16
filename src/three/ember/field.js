/**
 * ember/field.js — What the ground itself built: the vent field.
 *
 * Fumaroles (cones of altered rock crusted with sulphur round a throat that
 * breathes steam), the geyser's sinter cone, mud pots that bubble, the stepped
 * terraces a spring builds as it runs over its own deposits, mounds of sulphur
 * crystal, and lobes of black glass where a flow stopped. Plus the probe stakes
 * somebody left reading the ground's temperature.
 *
 * Each builder takes the world's `ctx` and the landmark, and returns ONE group in
 * the landmark's own frame, carrying what the world needs to know about it:
 *   userData.colliders  circles { x, z, r } in that frame (the world turns them)
 *   userData.vents      steam mouths { x, y, z, size, rise, life, rate } in that frame
 * Every part stays inside the radius the layout generator reserved for it.
 */

import * as THREE from 'three';
import { part, put, between, rockGeometry, roughLathe, rng } from './kit.js';

/* ------------------------------------------------------------- fumarole */

/** A cone of altered rock round a throat, crusted yellow where the gas condenses. */
export function buildFumarole(ctx, lm, seed = 1) {
  const s = lm.scale || 1;
  const g = new THREE.Group();
  const r = rng(0xf0a + seed * 97);
  const R = 1.5 * s, H = 0.85 * s;
  const prof = [[R, -0.08], [R * 0.86, 0.16 * s], [R * 0.62, 0.48 * s], [R * 0.36, 0.78 * s], [R * 0.25, H], [R * 0.17, 0.66 * s], [R * 0.12, 0.3 * s]];
  const cone = part(ctx, roughLathe(prof, 22, seed * 3.1, 0.11), ctx.M.sulphur, 0, 0, 0, { cast: true });
  g.add(cone);
  // The throat: dark, wet stone where nothing condenses because it is too hot.
  g.add(part(ctx, new THREE.CircleGeometry(R * 0.13, 10).rotateX(-Math.PI / 2), ctx.M.rock, 0, 0.32 * s, 0));
  // A collar of grey altered rock round the foot, where the sulphur has been leached out.
  for (let i = 0; i < 6; i++) {
    const a = r() * Math.PI * 2;
    const d = R * (0.75 + r() * 0.2);
    const size = (0.18 + r() * 0.2) * s;
    g.add(part(ctx, rockGeometry(size, seed * 13 + i, { squash: 0.6 }), ctx.M.rock, Math.sin(a) * d, -0.05, Math.cos(a) * d));
  }
  // Crystal blades round the lip.
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + r() * 0.4;
    const d = R * (0.3 + r() * 0.12);
    const h = (0.12 + r() * 0.14) * s;
    const blade = part(ctx, new THREE.ConeGeometry(0.035 * s, h, 4), ctx.M.sulphurPale, Math.sin(a) * d, H - 0.06 * s + h / 2, Math.cos(a) * d);
    blade.rotation.set((r() - 0.5) * 0.8, r() * 3, (r() - 0.5) * 0.8);
    g.add(blade);
  }
  g.userData.colliders = [{ x: 0, z: 0, r: R * 0.9 }];
  g.userData.vents = [{ x: 0, y: H * 0.7, z: 0, size: 0.42 * s, rise: 9 + 6 * s, life: 9, rate: 0.6 + 0.2 * s, alpha: 0.32 }];
  return g;
}

/* --------------------------------------------------------- sulphur mound */

/** A low heap of yellow crystal where an old vent sealed itself. */
export function buildSulphurMound(ctx, lm, seed = 1) {
  const s = lm.scale || 1;
  const g = new THREE.Group();
  const r = rng(0x5a1 + seed * 31);
  const n = 5 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const d = i === 0 ? 0 : (0.35 + r() * 0.55) * s;
    const size = (i === 0 ? 0.55 : 0.22 + r() * 0.24) * s;
    g.add(part(ctx, rockGeometry(size, seed * 7 + i, { squash: 0.55, rough: 0.35 }), i % 3 === 2 ? ctx.M.sulphurPale : ctx.M.sulphur, Math.sin(a) * d, -0.04, Math.cos(a) * d, { cast: true }));
  }
  g.userData.colliders = [{ x: 0, z: 0, r: 0.9 * s }];
  return g;
}

/* ---------------------------------------------------------------- mud pot */

/**
 * A pot of boiling grey clay: a raised lip, the mud flat inside it, and
 * bubbles that swell and burst (`userData.mover`, held out of the bake).
 */
export function buildMudPot(ctx, lm, seed = 1) {
  const s = lm.scale || 1;
  const g = new THREE.Group();
  const r = rng(0x3dd + seed * 17);
  const R = 2.3 * s;
  const lip = roughLathe([[R + 0.6 * s, -0.06], [R + 0.3 * s, 0.2 * s], [R + 0.05, 0.24 * s], [R - 0.1, 0.08], [R - 0.2, 0.02]], 30, seed * 2.3, 0.06);
  g.add(part(ctx, lip, ctx.M.clay, 0, 0, 0, { cast: true }));
  const mud = part(ctx, new THREE.CircleGeometry(R - 0.12, 30).rotateX(-Math.PI / 2), ctx.M.mud, 0, 0.05, 0);
  mud.userData.phys = 'ground';
  mud.receiveShadow = ctx.t4;
  g.add(mud);
  for (let i = 0; i < 6; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * (R - 0.6);
    const size = (0.14 + r() * 0.16) * s;
    const b = part(ctx, new THREE.SphereGeometry(size, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), ctx.M.mud, Math.sin(a) * d, 0.05, Math.cos(a) * d);
    b.userData.noMerge = true;
    b.userData.mover = { kind: 'bubble', rate: 0.35 + r() * 0.6, phase: r() };
    b.scale.setScalar(0.01);
    g.add(b);
  }
  g.userData.colliders = [{ x: 0, z: 0, r: R + 0.3 * s }];
  g.userData.vents = [{ x: 0, y: 0.15, z: 0, size: 0.7 * s, rise: 5, life: 8, rate: 0.4, alpha: 0.22 }];
  return g;
}

/* ------------------------------------------------------------------ geyser */

/**
 * The geyser's cone: sinter laid down by every eruption, in lipped steps, wet
 * and dark round the vent. The eruption itself is in `effects.js`.
 */
export function buildGeyser(ctx, lm, seed = 1) {
  const g = new THREE.Group();
  const r = rng(0x9e1 + seed);
  const prof = [[4.2, -0.06], [3.7, 0.16], [3.35, 0.22], [2.9, 0.48], [2.5, 0.54], [1.95, 0.9], [1.45, 0.98], [1.0, 1.36], [0.62, 1.5], [0.42, 1.32], [0.3, 0.9]];
  g.add(part(ctx, roughLathe(prof, 36, seed * 5.7, 0.07), ctx.M.sinter, 0, 0, 0, { cast: true }));
  // Wet and dark round the vent: the water never stops running off it.
  const wet = roughLathe([[1.28, 1.04], [0.95, 1.4], [0.6, 1.53], [0.44, 1.36]], 28, seed * 2.9, 0.05);
  g.add(part(ctx, wet, ctx.M.sinterWet, 0, 0.012, 0));
  // Geyserite beads along each lip.
  for (const [rad, y] of [[3.4, 0.22], [2.55, 0.54], [1.5, 0.98]]) {
    const n = Math.round(rad * 9);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r() * 0.2;
      const b = part(ctx, new THREE.SphereGeometry(0.07 + r() * 0.06, 6, 4), ctx.M.sinterWarm, Math.sin(a) * rad, y, Math.cos(a) * rad);
      b.scale.y = 0.6;
      g.add(b);
    }
  }
  g.add(part(ctx, new THREE.CircleGeometry(0.32, 12).rotateX(-Math.PI / 2), ctx.M.rock, 0, 0.92, 0));
  g.userData.colliders = [{ x: 0, z: 0, r: 3.6 }];
  g.userData.geyser = { x: 0, y: 1.45, z: 0 };
  return g;
}

/* --------------------------------------------------------- sinter terrace */

/** A ring of radius `R` whose edge scallops in and out, `h` thick, as one closed body. */
function scallopedDisc(R, h, lobes, seed, depth = 0.12) {
  const geo = new THREE.CylinderGeometry(R, R * 1.04, h, 48, 1, false);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const rr = Math.hypot(x, z);
    if (rr < 0.01) continue;
    const a = Math.atan2(x, z);
    const k = 1 + Math.sin(a * lobes + seed) * depth * 0.5 + Math.sin(a * lobes * 2.3 + seed * 2) * depth * 0.25;
    p.setX(i, x * k);
    p.setZ(i, z * k);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Stepped sinter terraces: each tier a scalloped rim holding a shallow pool of
 * water, overflowing onto the tier below, the whole thing pale with warm runoff
 * on its faces. A spring that ran here once, and runs still.
 */
export function buildSinterTerrace(ctx, lm, seed = 1) {
  const s = lm.scale || 1;
  const g = new THREE.Group();
  // The cascade runs down toward the landmark's turn; the group itself is never turned.
  const c = Math.cos(lm.rotY || 0), sn = Math.sin(lm.rotY || 0);
  const turn = (dx, dz) => [dx * c + dz * sn, -dx * sn + dz * c];
  const tiers = [
    [4.4, 0.32, 0, 0], [3.2, 0.66, -0.5, -0.35], [2.0, 0.98, -0.95, -0.7], [0.95, 1.26, -1.25, -0.95]
  ].map(([r, y, dx, dz]) => { const [tx, tz] = turn(dx * s, dz * s); return { r: r * s, y: y * s, dx: tx, dz: tz }; });
  tiers.forEach((t, i) => {
    const h = t.y + 0.08;
    const side = part(ctx, scallopedDisc(t.r, h, 7 + i * 2, seed + i, 0.16), i % 2 ? ctx.M.sinterWarm : ctx.M.sinter, t.dx, h / 2 - 0.08, t.dz, { cast: true });
    g.add(side);
    // The pool on its top, a finger below the lip.
    const pool = part(ctx, new THREE.CircleGeometry(t.r * 0.84, 28).rotateX(-Math.PI / 2), ctx.M.pool, t.dx - (i < 3 ? 0.08 * s : 0), t.y + 0.012, t.dz);
    pool.userData.phys = 'ground';
    g.add(pool);
  });
  // The source: a small vent at the top tier breathing a thread of steam.
  const top = tiers[tiers.length - 1];
  g.userData.colliders = [{ x: 0, z: 0, r: 3.9 * s }, { x: top.dx, z: top.dz, r: 1.2 * s }];
  g.userData.vents = [{ x: top.dx, y: top.y + 0.1, z: top.dz, size: 0.5 * s, rise: 6, life: 9, rate: 0.4, alpha: 0.24 }];
  return g;
}

/* -------------------------------------------------------------- lava lobe */

/**
 * Where a flow stopped: a cluster of black glass blocks, the biggest at the
 * snout, broken pieces fanned behind it. Every block is its own body, so the
 * overlap check and the walk see each one where it is.
 */
export function buildLavaLobe(ctx, lm, seed = 1) {
  const s = lm.scale || 1;
  const g = new THREE.Group();
  const r = rng(0x1a7a + seed * 53);
  const limit = (lm.radius || 4) - 0.2;
  const colliders = [];
  const n = 4 + Math.floor(r() * 4);
  for (let i = 0; i < n; i++) {
    const size = (i === 0 ? 1.45 : 0.55 + r() * 0.75) * s;
    const a = r() * Math.PI * 2;
    let d = i === 0 ? 0 : (0.9 + r() * 1.6) * s;
    if (d + size > limit) d = Math.max(0, limit - size);
    const x = Math.sin(a) * d, z = Math.cos(a) * d;
    const rock = part(ctx, rockGeometry(size, seed * 11 + i, { squash: 0.5 + r() * 0.3, rough: 0.34, detail: 2 }), ctx.M.rock, x, -0.12 * s, z, { cast: true });
    g.add(rock);
    colliders.push({ x, z, r: size * 0.92 });
  }
  g.userData.colliders = colliders;
  return g;
}

/* ------------------------------------------------------------ probe stake */

/** A temperature probe driven into the crust, with its dial and a tag. Walked past, not round. */
export function buildProbeStake(ctx, lm, seed = 1) {
  const g = new THREE.Group();
  const r = rng(0x7a1e + seed);
  const lean = (r() - 0.5) * 0.12;
  const rod = part(ctx, new THREE.CylinderGeometry(0.012, 0.012, 1.15, 6), ctx.M.steel, 0, 0.5, 0);
  rod.rotation.z = lean;
  g.add(rod);
  const head = part(ctx, new THREE.CylinderGeometry(0.055, 0.055, 0.035, 14), ctx.M.brass, -Math.sin(lean) * 1.05, 1.07, 0);
  put(g, head, Math.PI / 2, 0, lean);
  g.add(part(ctx, new THREE.CircleGeometry(0.045, 14), ctx.M.glassDark, -Math.sin(lean) * 1.05, 1.07, 0.019));
  g.add(part(ctx, new THREE.BoxGeometry(0.11, 0.06, 0.004), ctx.M.paintYellow, -Math.sin(lean) * 0.8, 0.82, 0.02));
  g.userData.colliders = [];
  return g;
}

/* ------------------------------------------------------------- spring lip */

/**
 * The lip round the hot spring: a low scalloped wall of pale sinter, with
 * beads along its crest, that the water has built and keeps building. It is
 * part of the ground (`phys: 'ground'`): what a player stands at the edge of.
 */
export function buildSpringLip(ctx, spring, seed = 3) {
  const g = new THREE.Group();
  g.name = 'ember-spring-lip';
  g.userData.phys = 'ground';
  const R = spring.radius;
  const lip = roughLathe([[R + 1.3, -0.12], [R + 0.7, 0.05], [R + 0.25, 0.14], [R - 0.05, 0.1], [R - 0.3, -0.1]], 96, seed, 0.012);
  g.add(part(ctx, lip, ctx.M.sinterWarm));
  const r = rng(0x5b1);
  const n = Math.round(R * 2 * Math.PI * 2.2);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.05;
    const d = R + 0.15 + r() * 0.2;
    const b = part(ctx, new THREE.SphereGeometry(0.06 + r() * 0.07, 6, 4), ctx.M.sinter, Math.sin(a) * d, 0.12, Math.cos(a) * d);
    b.scale.y = 0.5;
    g.add(b);
  }
  return g;
}

export { between };
