/**
 * ember/plant.js — Everything people built at Ember Reach.
 *
 * The geothermal plant, in the order the steam goes through it: the wellheads
 * that draw it out of the ground, the caldera main that carries it round the
 * north of the shelf on its supports (lifted into an expansion loop where the
 * lane runs out to the rim), the separator that takes the water out of it, the
 * silencers that vent what is not wanted, the turbine hall that turns it into
 * power, and the cooling cells that throw its heat into the sky. A transformer
 * and a line of pylons carry the power away south-west to the shelters, two of
 * which stand cold at the edge of the shelf. And on the overlook, clamped to
 * the main, the thing the Fifth Guild put there: a heat exchanger furred with
 * frost in a field of steam, which vents nothing.
 *
 * Plus what every world has: the work lamps, the pad, the mast, the crates.
 *
 * Builders return ONE group in the landmark's own frame, with
 * `userData.colliders` (circles, or boxes for an unturned building) and
 * `userData.vents` (steam mouths) in that frame. ONLY LAMPS ARE LIT: a lamp is
 * a `lampMark` the world pools into three real lights, and nothing here owns a
 * PointLight. A fan that turns is a `userData.mover`, held out of the bake.
 */

import * as THREE from 'three';
import { placard } from '../materials/pbr-kit.js';
import { part, put, between, strut, rockGeometry, rng } from './kit.js';

const FILAMENT = 0xd99423;

/** A lamp: the glass that glows, and the mark the pool lights from. */
function lampAt(ctx, g, x, y, z, { intensity = 5, distance = 13, w = 0.15, h = 0.24 } = {}) {
  g.add(part(ctx, new THREE.CylinderGeometry(w / 2, w / 2, h, 8), ctx.M.lantern, x, y, z));
  const mark = new THREE.Object3D();
  mark.position.set(x, y, z);
  mark.userData.lamp = { color: 0xe6a443, intensity, distance, decay: 1.6 };
  g.add(mark);
  ctx.lamps.push(mark);
}

function sign(ctx, text, w, h) {
  const p = placard(text, { w, h, fg: '#1e1a14', bg: '#d8c9a2' });
  ctx.own(p.geometry, p.material, p.material.map);
  return p;
}

/** A railing of posts and two rails round a rectangle, open on the sides listed in `gaps`. */
function railing(ctx, g, x0, x1, z0, z1, y0, { gaps = [], mat = null } = {}) {
  const M = mat || ctx.M.paintYellow;
  const H = 1.05;
  const sides = [
    ['n', [x0, z0], [x1, z0]], ['e', [x1, z0], [x1, z1]], ['s', [x1, z1], [x0, z1]], ['w', [x0, z1], [x0, z0]]
  ];
  for (const [id, a, b] of sides) {
    if (gaps.includes(id)) continue;
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(1, Math.round(L / 1.4));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      g.add(part(ctx, new THREE.BoxGeometry(0.05, H, 0.05), ctx.M.darkSteel, a[0] + (b[0] - a[0]) * t, y0 + H / 2, a[1] + (b[1] - a[1]) * t));
    }
    for (const y of [y0 + H, y0 + H * 0.5]) g.add(strut(ctx, [a[0], y, a[1]], [b[0], y, b[1]], 0.045, 0.045, M));
  }
}

/** A ladder up a face: two stiles and rungs, from y0 to y1 at (x, z), facing `along` (x or z). */
function ladder(ctx, g, x, z, y0, y1, along = 'x') {
  const off = along === 'x' ? [0.22, 0] : [0, 0.22];
  for (const k of [-1, 1]) g.add(between(ctx, [x + off[0] * k, y0, z + off[1] * k], [x + off[0] * k, y1, z + off[1] * k], 0.022, ctx.M.darkSteel, 6));
  for (let y = y0 + 0.3; y < y1; y += 0.3) g.add(between(ctx, [x - off[0], y, z - off[1]], [x + off[0], y, z + off[1]], 0.014, ctx.M.darkSteel, 5));
}

/* ------------------------------------------------------------- wellhead */

/**
 * A production wellhead on its cellar slab: the master valve, the spool, the
 * tee with its wing valve and flowline (local +x, toward the main), the crown
 * valve and swab cap, a gauge, and a railing round it all.
 */
export function buildWellhead(ctx) {
  const g = new THREE.Group();
  const slab = part(ctx, new THREE.BoxGeometry(3.8, 0.12, 3.8), ctx.M.concrete, 0, 0.0, 0);
  slab.userData.phys = 'ground';
  slab.receiveShadow = ctx.t4;
  g.add(slab);
  // The casing head and the master valve.
  g.add(part(ctx, new THREE.CylinderGeometry(0.42, 0.48, 0.32, 18), ctx.M.rusted, 0, 0.22, 0, { cast: true }));
  g.add(part(ctx, new THREE.CylinderGeometry(0.3, 0.3, 0.6, 16), ctx.M.steel, 0, 0.66, 0, { cast: true }));
  g.add(part(ctx, new THREE.BoxGeometry(0.62, 0.48, 0.56), ctx.M.steel, 0, 1.08, 0, { cast: true }));
  put(g, part(ctx, new THREE.TorusGeometry(0.3, 0.035, 6, 18), ctx.M.paintRed, 0, 1.08, 0.46), 0, 0, 0);
  g.add(between(ctx, [0, 1.08, 0.28], [0, 1.08, 0.46], 0.03, ctx.M.darkSteel, 6));
  // The tee, and the flowline out along +x to the spur's riser.
  g.add(part(ctx, new THREE.CylinderGeometry(0.26, 0.26, 0.5, 16), ctx.M.steel, 0, 1.6, 0));
  // The spur's riser stands on the flowline's capped end (local x = 2.0).
  g.add(between(ctx, [0.2, 1.65, 0], [2.2, 1.65, 0], 0.17, ctx.M.clad, 12));
  g.add(part(ctx, new THREE.SphereGeometry(0.17, 12, 8), ctx.M.clad, 2.2, 1.65, 0));
  g.add(part(ctx, new THREE.BoxGeometry(0.44, 0.42, 0.4), ctx.M.steel, 0.85, 1.65, 0));
  put(g, part(ctx, new THREE.TorusGeometry(0.22, 0.03, 6, 16), ctx.M.paintRed, 0.85, 2.05, 0), Math.PI / 2, 0, 0);
  g.add(between(ctx, [0.85, 1.86, 0], [0.85, 2.05, 0], 0.025, ctx.M.darkSteel, 6));
  for (const x of [0.4, 1.3, 2.0]) put(g, part(ctx, new THREE.CylinderGeometry(0.24, 0.24, 0.06, 14), ctx.M.darkSteel, x, 1.65, 0), 0, 0, Math.PI / 2);
  // The crown valve and the swab cap on top.
  g.add(part(ctx, new THREE.BoxGeometry(0.5, 0.4, 0.46), ctx.M.steel, 0, 2.06, 0));
  put(g, part(ctx, new THREE.TorusGeometry(0.24, 0.03, 6, 16), ctx.M.paintRed, -0.38, 2.06, 0), 0, Math.PI / 2, 0);
  g.add(part(ctx, new THREE.CylinderGeometry(0.2, 0.24, 0.3, 14), ctx.M.rusted, 0, 2.42, 0));
  // A gauge on its stalk.
  g.add(between(ctx, [-0.3, 1.6, 0], [-0.62, 1.6, 0], 0.025, ctx.M.darkSteel, 6));
  put(g, part(ctx, new THREE.CylinderGeometry(0.11, 0.11, 0.05, 16), ctx.M.brass, -0.66, 1.6, 0), 0, 0, Math.PI / 2);
  // The railing, open where the flowline leaves.
  railing(ctx, g, -1.75, 1.75, -1.75, 1.75, 0.06, { gaps: ['e'] });
  const tag = sign(ctx, 'WELL', 0.42, 0.16);
  tag.position.set(-1.75, 0.75, 0);
  tag.rotation.y = -Math.PI / 2;
  g.add(tag);
  g.userData.colliders = [{ x: 0, z: 0, r: 1.4 }, { x: -1.75, z: 0, r: 0.35 }, { x: 0, z: 1.75, r: 0.35 }, { x: 0, z: -1.75, r: 0.35 }];
  g.userData.vents = [{ x: 0, y: 2.6, z: 0, size: 0.25, rise: 4, life: 6, rate: 0.25, alpha: 0.25 }];
  return g;
}

/* ------------------------------------------------------------ separator */

/**
 * The separator: a tall cyclone vessel that spins the water out of the steam.
 * Inlet on its west side at the main's height, steam out of the top, brine out
 * of the bottom to a sump; a scrubber beside it; a ladder and a platform.
 */
export function buildSeparator(ctx) {
  const g = new THREE.Group();
  const plinth = part(ctx, new THREE.BoxGeometry(7.2, 0.16, 7.2), ctx.M.concrete, 0, 0.0, 0);
  plinth.userData.phys = 'ground';
  plinth.receiveShadow = ctx.t4;
  g.add(plinth);
  const R = 1.6;
  g.add(part(ctx, new THREE.CylinderGeometry(R, R, 7, 28), ctx.M.clad, 0, 5.7, 0, { cast: true }));
  g.add(part(ctx, new THREE.SphereGeometry(R, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2), ctx.M.clad, 0, 9.2, 0, { cast: true }));
  g.add(part(ctx, new THREE.ConeGeometry(R, 1.1, 28, 1, true).rotateX(Math.PI), ctx.M.clad, 0, 1.65, 0));
  for (let k = 0; k < 6; k++) g.add(part(ctx, new THREE.TorusGeometry(R + 0.02, 0.04, 6, 32).rotateX(Math.PI / 2), ctx.M.darkSteel, 0, 2.6 + k * 1.25, 0));
  for (const [x, z] of [[1.1, 1.1], [-1.1, 1.1], [1.1, -1.1], [-1.1, -1.1]]) {
    g.add(part(ctx, new THREE.BoxGeometry(0.26, 2.4, 0.26), ctx.M.steel, x, 1.2, z, { cast: true }));
    g.add(part(ctx, new THREE.BoxGeometry(0.5, 0.06, 0.5), ctx.M.darkSteel, x, 0.11, z));
  }
  // The inlet, west, at the main's height, with its flange.
  g.add(between(ctx, [-R + 0.1, 3.0, 0], [-1.86, 3.0, 0], 0.6, ctx.M.clad, 18));
  put(g, part(ctx, new THREE.CylinderGeometry(0.78, 0.78, 0.1, 20), ctx.M.darkSteel, -1.8, 3.0, 0), 0, 0, Math.PI / 2);
  // Steam out of the top.
  g.add(part(ctx, new THREE.CylinderGeometry(0.34, 0.34, 1.1, 14), ctx.M.clad, 0, 10.6, 0));
  g.add(part(ctx, new THREE.CylinderGeometry(0.42, 0.42, 0.08, 14), ctx.M.darkSteel, 0, 11.12, 0));
  // Brine out of the bottom, east to the sump.
  g.add(between(ctx, [0, 1.05, 0], [0, 0.5, 0], 0.2, ctx.M.rusted, 10));
  g.add(between(ctx, [0, 0.5, 0], [5.2, 0.5, 0], 0.2, ctx.M.rusted, 10));
  g.add(part(ctx, new THREE.BoxGeometry(1.2, 0.7, 1.2), ctx.M.concrete, 5.5, 0.35, 0));
  // The scrubber.
  g.add(part(ctx, new THREE.CylinderGeometry(0.75, 0.75, 4.6, 20), ctx.M.clad, 2.6, 2.6, 2.7, { cast: true }));
  g.add(part(ctx, new THREE.SphereGeometry(0.75, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), ctx.M.clad, 2.6, 4.9, 2.7));
  g.add(between(ctx, [2.6, 5.4, 2.7], [2.6, 6.2, 2.7], 0.14, ctx.M.clad));
  g.add(between(ctx, [2.6, 6.2, 2.7], [0.8, 8.2, 1.1], 0.14, ctx.M.clad));
  // The platform at the top, its railing and the ladder up to it.
  g.add(part(ctx, new THREE.CylinderGeometry(R + 0.9, R + 0.9, 0.08, 28), ctx.M.darkSteel, 0, 9.45, 0));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.add(part(ctx, new THREE.BoxGeometry(0.05, 1.0, 0.05), ctx.M.darkSteel, Math.sin(a) * (R + 0.85), 9.98, Math.cos(a) * (R + 0.85)));
  }
  g.add(part(ctx, new THREE.TorusGeometry(R + 0.85, 0.03, 5, 36).rotateX(Math.PI / 2), ctx.M.paintYellow, 0, 10.48, 0));
  ladder(ctx, g, 0, R + 0.45, 0.1, 9.45, 'x');
  const tag = sign(ctx, 'SEPARATOR 1', 1.2, 0.3);
  tag.position.set(0, 4.0, R + 0.02);
  g.add(tag);
  g.userData.colliders = [
    { x: 0, z: 0, r: 1.95 }, { x: 0, z: R + 0.45, r: 0.4 }, { x: 2.6, z: 2.7, r: 0.95 },
    { x: 5.5, z: 0, r: 0.95 }, { x: 3, z: 0, r: 0.35 }, { x: 1.5, z: 0, r: 0.35 }, { x: 4.2, z: 0, r: 0.35 }
  ];
  g.userData.vents = [{ x: 0, y: 11.2, z: 0, size: 0.5, rise: 12, life: 10, rate: 0.5, alpha: 0.3 }];
  return g;
}

/* ------------------------------------------------------------- silencers */

/** Two rock-muffler silencers: open-topped drums that let unwanted steam go quietly. */
export function buildSilencerPair(ctx) {
  const g = new THREE.Group();
  const vents = [];
  const colliders = [];
  for (const x of [-2.6, 2.6]) {
    const plinth = part(ctx, new THREE.CylinderGeometry(2.1, 2.2, 0.3, 24), ctx.M.concrete, x, 0.1, 0);
    g.add(plinth);
    g.add(part(ctx, new THREE.CylinderGeometry(1.7, 1.75, 5.4, 28, 1, true), ctx.M.rusted, x, 2.95, 0, { cast: true }));
    g.add(part(ctx, new THREE.CylinderGeometry(1.62, 1.62, 0.2, 28), ctx.M.rock, x, 4.9, 0));
    for (let k = 0; k < 4; k++) g.add(part(ctx, new THREE.TorusGeometry(1.76, 0.05, 6, 32).rotateX(Math.PI / 2), ctx.M.darkSteel, x, 0.9 + k * 1.35, 0));
    g.add(part(ctx, new THREE.TorusGeometry(1.72, 0.07, 6, 32).rotateX(Math.PI / 2), ctx.M.darkSteel, x, 5.62, 0));
    // The inlet, low on the back, coming up out of the ground.
    g.add(between(ctx, [x, 1.0, -1.6], [x, 1.0, -2.9], 0.36, ctx.M.clad, 14));
    g.add(between(ctx, [x, 1.0, -2.9], [x, -0.2, -2.9], 0.36, ctx.M.clad, 14));
    vents.push({ x, y: 5.6, z: 0, size: 1.15, rise: 34, life: 18, rate: 1.1, alpha: 0.34 });
    colliders.push({ x, z: 0, r: 2.0 }, { x, z: -2.9, r: 0.55 });
  }
  ladder(ctx, g, 2.6, 1.95, 0.25, 5.6, 'x');
  const tag = sign(ctx, 'SILENCERS', 1.0, 0.26);
  tag.position.set(0, 1.6, 0.6);
  g.add(tag);
  g.userData.colliders = colliders;
  g.userData.vents = vents;
  return g;
}

/* ----------------------------------------------------------- turbine hall */

/**
 * The turbine hall: a steel-framed shed on a concrete plinth wall, clad in
 * ribbed sheet, a clerestory of dark glass under the eaves, a gable roof with a
 * vent along its ridge, a roller door facing the shelf and the main coming in
 * through the north gable. 12 m wide (x) by 24 m long (z); never turned, so it
 * collides as a box.
 */
export function buildTurbineHall(ctx) {
  const g = new THREE.Group();
  const W = 12, L = 24, EAVE = 8, RIDGE = 10.4;
  const slab = part(ctx, new THREE.BoxGeometry(W + 1.2, 0.16, L + 1.2), ctx.M.concrete, 0, 0.0, 0);
  slab.userData.phys = 'ground';
  g.add(slab);
  // The plinth wall and the clad walls above it, in panels so each is its own box.
  const wallMat = ctx.M.hallWall;
  for (const sx of [-1, 1]) {
    g.add(part(ctx, new THREE.BoxGeometry(0.3, 1.1, L), ctx.M.concrete, sx * (W / 2 - 0.15), 0.55, 0, { cast: true }));
    for (let i = 0; i < 4; i++) {
      const zc = -L / 2 + L / 8 + i * L / 4;
      // The east side (facing the shelf) has the roller door in its second bay.
      if (sx > 0 && i === 1) {
        g.add(part(ctx, new THREE.BoxGeometry(0.2, EAVE - 6.2, L / 4), wallMat, sx * (W / 2 - 0.1), 6.2 + (EAVE - 6.2) / 2, zc));
        g.add(part(ctx, new THREE.BoxGeometry(0.12, 5.0, 4.6), ctx.M.rusted, sx * (W / 2 - 0.02), 3.6, zc));
        for (let k = 0; k < 16; k++) g.add(part(ctx, new THREE.BoxGeometry(0.04, 0.03, 4.6), ctx.M.darkSteel, sx * (W / 2 + 0.06), 1.2 + k * 0.3, zc));
        for (const dz of [-2.45, 2.45]) g.add(part(ctx, new THREE.BoxGeometry(0.3, 6.2, 0.3), ctx.M.steel, sx * (W / 2 + 0.02), 3.1, zc + dz));
        g.add(part(ctx, new THREE.BoxGeometry(0.5, 0.5, 5.2), ctx.M.steel, sx * (W / 2 + 0.1), 6.35, zc));
        continue;
      }
      g.add(part(ctx, new THREE.BoxGeometry(0.2, EAVE - 1.1 - 1.6, L / 4), wallMat, sx * (W / 2 - 0.1), 1.1 + (EAVE - 2.7) / 2, zc, { cast: true }));
      // The clerestory.
      g.add(part(ctx, new THREE.BoxGeometry(0.12, 1.2, L / 4 - 0.4), ctx.M.glassDark, sx * (W / 2 - 0.08), EAVE - 0.95, zc));
      g.add(part(ctx, new THREE.BoxGeometry(0.22, 0.25, L / 4), ctx.M.steel, sx * (W / 2 - 0.1), EAVE - 0.2, zc));
    }
    // Frame columns on the face, between the bays.
    for (let i = 0; i <= 4; i++) g.add(part(ctx, new THREE.BoxGeometry(0.34, EAVE, 0.34), ctx.M.steel, sx * (W / 2 + 0.07), EAVE / 2, -L / 2 + i * L / 4));
  }
  // The gables: a wall and a triangle over it.
  for (const sz of [-1, 1]) {
    g.add(part(ctx, new THREE.BoxGeometry(W, 1.1, 0.3), ctx.M.concrete, 0, 0.55, sz * (L / 2 - 0.15)));
    g.add(part(ctx, new THREE.BoxGeometry(W - 0.4, EAVE - 1.1, 0.2), wallMat, 0, 1.1 + (EAVE - 1.1) / 2, sz * (L / 2 - 0.1), { cast: true }));
    const tri = new THREE.Shape();
    tri.moveTo(-W / 2, 0); tri.lineTo(W / 2, 0); tri.lineTo(0, RIDGE - EAVE); tri.closePath();
    const tg = new THREE.ExtrudeGeometry(tri, { depth: 0.2, bevelEnabled: false });
    tg.translate(0, 0, -0.1);
    g.add(part(ctx, tg, wallMat, 0, EAVE, sz * (L / 2 - 0.1)));
  }
  // The main comes in through the north gable: a collar where it does.
  put(g, part(ctx, new THREE.CylinderGeometry(0.8, 0.8, 0.28, 20), ctx.M.darkSteel, 0, 3.0, -L / 2 - 0.16), Math.PI / 2, 0, 0);
  // The roof, in two slopes with ribs, and the ridge vent.
  const slope = Math.atan2(RIDGE - EAVE, W / 2);
  const span = Math.hypot(W / 2, RIDGE - EAVE) + 0.5;
  for (const sx of [-1, 1]) {
    const roof = part(ctx, new THREE.BoxGeometry(span, 0.14, L + 0.8), ctx.M.hallRoof, sx * W / 4, EAVE + (RIDGE - EAVE) / 2 + 0.1, 0, { cast: true });
    roof.rotation.z = -sx * slope;
    g.add(roof);
  }
  g.add(part(ctx, new THREE.BoxGeometry(1.4, 0.7, L - 4), ctx.M.steel, 0, RIDGE + 0.4, 0, { cast: true }));
  for (let i = 0; i < 8; i++) g.add(part(ctx, new THREE.BoxGeometry(1.5, 0.06, 0.3), ctx.M.darkSteel, 0, RIDGE + 0.8, -L / 2 + 2.6 + i * 2.7));
  // Gland steam off a stack at the south end.
  g.add(part(ctx, new THREE.CylinderGeometry(0.35, 0.4, 3.2, 14), ctx.M.rusted, 3.2, RIDGE + 0.4, L / 2 - 3.5, { cast: true }));
  // A personnel door with its hood lamp, on the shelf side.
  g.add(part(ctx, new THREE.BoxGeometry(0.1, 2.2, 1.1), ctx.M.rusted, W / 2 + 0.04, 1.1 + 0.1, 6.2));
  g.add(part(ctx, new THREE.BoxGeometry(0.6, 0.08, 1.4), ctx.M.darkSteel, W / 2 + 0.3, 2.65, 6.2));
  lampAt(ctx, g, W / 2 + 0.32, 2.48, 6.2, { intensity: 5, distance: 12 });
  // Downpipes on the corners.
  for (const [x, z] of [[W / 2 + 0.3, -L / 2 + 0.4], [W / 2 + 0.3, L / 2 - 0.4], [-W / 2 - 0.3, -L / 2 + 0.4], [-W / 2 - 0.3, L / 2 - 0.4]]) {
    g.add(part(ctx, new THREE.CylinderGeometry(0.08, 0.08, EAVE, 8), ctx.M.darkSteel, x, EAVE / 2, z));
  }
  const tag = sign(ctx, 'TURBINE HALL 1', 2.6, 0.5);
  tag.position.set(W / 2 + 0.26, 7.0, 0);
  tag.rotation.y = Math.PI / 2;
  g.add(tag);
  g.userData.colliders = [{ minX: -W / 2 - 0.5, maxX: W / 2 + 0.5, minZ: -L / 2 - 0.5, maxZ: L / 2 + 0.5 }];
  g.userData.vents = [{ x: 3.2, y: RIDGE + 2.0, z: L / 2 - 3.5, size: 0.6, rise: 14, life: 11, rate: 0.5, alpha: 0.3 }];
  return g;
}

/* ---------------------------------------------------------- cooling cells */

/**
 * A three-cell mechanical-draft cooling tower: a basin, louvred sides, a fan
 * deck and three fan stacks whose fans turn (`userData.mover`), each throwing
 * up its own plume. 16 m long on its local x.
 */
export function buildCoolingCells(ctx) {
  const g = new THREE.Group();
  const L = 16, D = 7, H = 6.4;
  g.add(part(ctx, new THREE.BoxGeometry(L + 1, 0.9, D + 1), ctx.M.concrete, 0, 0.45, 0, { cast: true }));
  // Louvres: horizontal slats raked in, down both long faces and the ends.
  for (const sz of [-1, 1]) {
    for (let k = 0; k < 10; k++) {
      const s = part(ctx, new THREE.BoxGeometry(L, 0.06, 0.4), ctx.M.timber, 0, 1.2 + k * 0.36, sz * (D / 2 - 0.1));
      s.rotation.x = sz * 0.6;
      g.add(s);
    }
    g.add(part(ctx, new THREE.BoxGeometry(L, H - 4.6, 0.16), ctx.M.hallWall, 0, 4.9 + (H - 4.9) / 2, sz * (D / 2 - 0.08), { cast: true }));
  }
  for (const sx of [-1, 1]) {
    g.add(part(ctx, new THREE.BoxGeometry(0.16, H - 0.9, D), ctx.M.hallWall, sx * (L / 2 - 0.08), 0.9 + (H - 0.9) / 2, 0, { cast: true }));
  }
  for (let i = 0; i <= 4; i++) {
    for (const sz of [-1, 1]) g.add(part(ctx, new THREE.BoxGeometry(0.24, H - 0.9, 0.24), ctx.M.steel, -L / 2 + i * L / 4, 0.9 + (H - 0.9) / 2, sz * (D / 2 + 0.05)));
  }
  g.add(part(ctx, new THREE.BoxGeometry(L, 0.18, D), ctx.M.darkSteel, 0, H, 0, { cast: true }));
  const vents = [];
  for (const x of [-5.2, 0, 5.2]) {
    g.add(part(ctx, new THREE.CylinderGeometry(1.75, 1.95, 2.2, 28, 1, true), ctx.M.hallWall, x, H + 1.1, 0, { cast: true }));
    g.add(part(ctx, new THREE.TorusGeometry(1.76, 0.06, 6, 32).rotateX(Math.PI / 2), ctx.M.darkSteel, x, H + 2.2, 0));
    // The fan: hub and seven blades, turning.
    const fan = new THREE.Group();
    fan.position.set(x, H + 1.0, 0);
    fan.add(part(ctx, new THREE.CylinderGeometry(0.22, 0.22, 0.3, 12), ctx.M.darkSteel));
    for (let b = 0; b < 7; b++) {
      const blade = part(ctx, new THREE.BoxGeometry(1.45, 0.03, 0.32), ctx.M.steel, 0, 0, 0);
      blade.position.set(Math.cos((b / 7) * Math.PI * 2) * 0.85, 0, Math.sin((b / 7) * Math.PI * 2) * 0.85);
      blade.rotation.set(0.22, -(b / 7) * Math.PI * 2, 0);
      fan.add(blade);
    }
    fan.userData.noMerge = true;
    fan.userData.mover = { kind: 'yaw', rate: 2.6 + x * 0.04 };
    g.add(fan);
    vents.push({ x, y: H + 2.3, z: 0, size: 1.05, rise: 30, life: 16, rate: 1.0, alpha: 0.3 });
  }
  // Stair up the west end.
  for (let k = 0; k < 14; k++) g.add(part(ctx, new THREE.BoxGeometry(0.9, 0.05, 0.3), ctx.M.darkSteel, -L / 2 - 0.7, 0.4 + k * 0.42, -2.6 + k * 0.38));
  g.add(between(ctx, [-L / 2 - 1.15, 0.4, -2.6], [-L / 2 - 1.15, 6.3, 2.7], 0.03, ctx.M.paintYellow, 6));
  railing(ctx, g, -L / 2 + 0.2, L / 2 - 0.2, -D / 2 + 0.2, D / 2 - 0.2, H + 0.09, { gaps: [] });
  const tag = sign(ctx, 'COOLING', 1.2, 0.3);
  tag.position.set(0, 1.0, D / 2 + 0.52);
  g.add(tag);
  g.userData.colliders = [];
  for (let x = -L / 2 + 1.2; x <= L / 2 - 1.2; x += 2.4) {
    for (const z of [-D / 2 + 0.4, 0, D / 2 - 0.4]) g.userData.colliders.push({ x, z, r: 1.5 });
  }
  g.userData.colliders.push({ x: -L / 2 - 0.7, z: 0, r: 1.0 }, { x: -L / 2 - 0.7, z: 2.2, r: 1.0 }, { x: -L / 2 - 0.7, z: -2.2, r: 1.0 });
  g.userData.vents = vents;
  return g;
}

/* ------------------------------------------------------------ transformer */

export function buildTransformer(ctx) {
  const g = new THREE.Group();
  const pad = part(ctx, new THREE.BoxGeometry(6.4, 0.2, 5), ctx.M.concrete, 0, 0.0, 0);
  pad.userData.phys = 'ground';
  g.add(pad);
  g.add(part(ctx, new THREE.BoxGeometry(2.4, 2.4, 1.7), ctx.M.steel, 0, 1.3, 0, { cast: true }));
  for (let i = 0; i < 9; i++) {
    for (const sz of [-1, 1]) g.add(part(ctx, new THREE.BoxGeometry(0.05, 1.9, 0.5), ctx.M.darkSteel, -1.0 + i * 0.25, 1.2, sz * 1.1));
  }
  g.add(between(ctx, [-1.1, 2.9, -0.5], [1.1, 2.9, -0.5], 0.34, ctx.M.steel, 14));
  for (const x of [-0.7, 0, 0.7]) {
    for (let k = 0; k < 6; k++) g.add(part(ctx, new THREE.CylinderGeometry(0.12, 0.12, 0.05, 10), ctx.M.insul, x, 2.6 + k * 0.12, 0.3));
    g.add(part(ctx, new THREE.CylinderGeometry(0.03, 0.03, 0.85, 6), ctx.M.brass, x, 2.95, 0.3));
  }
  // A fence of posts and mesh round it.
  for (let i = 0; i < 12; i++) {
    const t = i / 12;
    const per = 2 * (5.6 + 4.2);
    let d = t * per, x, z;
    if (d < 5.6) { x = -2.8 + d; z = -2.1; } else if ((d -= 5.6) < 4.2) { x = 2.8; z = -2.1 + d; } else if ((d -= 4.2) < 5.6) { x = 2.8 - d; z = 2.1; } else { d -= 5.6; x = -2.8; z = 2.1 - d; }
    g.add(part(ctx, new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6), ctx.M.darkSteel, x, 1.2, z));
  }
  for (const [a, b] of [[[-2.8, -2.1], [2.8, -2.1]], [[2.8, -2.1], [2.8, 2.1]], [[2.8, 2.1], [-2.8, 2.1]], [[-2.8, 2.1], [-2.8, -2.1]]]) {
    g.add(strut(ctx, [a[0], 2.28, a[1]], [b[0], 2.28, b[1]], 0.035, 0.035, ctx.M.darkSteel));
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const mesh = part(ctx, new THREE.PlaneGeometry(len, 2.0), ctx.M.mesh, (a[0] + b[0]) / 2, 1.2, (a[1] + b[1]) / 2);
    mesh.rotation.y = Math.atan2(-(b[1] - a[1]), b[0] - a[0]);
    g.add(mesh);
  }
  const tag = sign(ctx, 'DANGER HV', 0.6, 0.22);
  tag.position.set(0, 1.4, 2.12);
  g.add(tag);
  g.userData.colliders = [{ minX: -3.0, maxX: 3.0, minZ: -2.3, maxZ: 2.3 }];
  g.userData.attach = [[-0.7, 3.38, 0.3], [0, 3.38, 0.3], [0.7, 3.38, 0.3]];
  return g;
}

/* ------------------------------------------------------------------ pylon */

/** A lattice pylon, 18 m, with two cross-arms and three insulator strings. */
export function buildPylon(ctx) {
  const g = new THREE.Group();
  const H = 17.5;
  const base = 1.6, top = 0.45;
  const leg = (sx, sz, y) => { const k = y / H; const w = base + (top - base) * k; return [sx * w, y, sz * w]; };
  const corners = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
  for (const [sx, sz] of corners) {
    for (let y = 0; y < H; y += 3.5) g.add(between(ctx, leg(sx, sz, y), leg(sx, sz, Math.min(H, y + 3.5)), 0.07, ctx.M.steel, 5));
    g.add(part(ctx, new THREE.BoxGeometry(0.5, 0.4, 0.5), ctx.M.concrete, sx * base, 0.1, sz * base));
  }
  // Bracing: an X in each face of each panel.
  for (let y = 0; y < H - 0.1; y += 3.5) {
    const y1 = Math.min(H, y + 3.5);
    for (let i = 0; i < 4; i++) {
      const [ax, az] = corners[i], [bx, bz] = corners[(i + 1) % 4];
      g.add(between(ctx, leg(ax, az, y), leg(bx, bz, y1), 0.035, ctx.M.darkSteel, 4));
      g.add(between(ctx, leg(bx, bz, y), leg(ax, az, y1), 0.035, ctx.M.darkSteel, 4));
      g.add(between(ctx, leg(ax, az, y1), leg(bx, bz, y1), 0.035, ctx.M.darkSteel, 4));
    }
  }
  const attach = [];
  for (const [y, w] of [[H - 2.5, 3.4], [H, 2.2]]) {
    g.add(part(ctx, new THREE.BoxGeometry(w * 2, 0.2, 0.3), ctx.M.steel, 0, y, 0, { cast: true }));
  }
  for (const [x, y] of [[-3.1, H - 2.5], [3.1, H - 2.5], [0, H]]) {
    const yy = y === H ? H + 0.1 : y;
    for (let k = 0; k < 6; k++) g.add(part(ctx, new THREE.CylinderGeometry(0.11, 0.11, 0.05, 10), ctx.M.insul, x === 0 ? 1.9 : x, yy - 0.2 - k * 0.12, 0));
    attach.push([x === 0 ? 1.9 : x, yy - 0.95, 0]);
  }
  g.userData.colliders = corners.map(([sx, sz]) => ({ x: sx * base, z: sz * base, r: 0.35 }));
  g.userData.attach = attach;
  return g;
}

/* -------------------------------------------------------------- comms mast */

export function buildCommsMast(ctx) {
  const g = new THREE.Group();
  const H = 18;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    g.add(between(ctx, [Math.cos(a) * 0.55, 0, Math.sin(a) * 0.55], [Math.cos(a) * 0.14, H, Math.sin(a) * 0.14], 0.05, ctx.M.steel));
  }
  for (let y = 1.5; y < H; y += 1.6) {
    const w = 0.55 - (y / H) * 0.41;
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2, b = ((i + 1) / 3) * Math.PI * 2;
      g.add(between(ctx, [Math.cos(a) * w, y, Math.sin(a) * w], [Math.cos(b) * w, y + 1.6, Math.sin(b) * w], 0.018, ctx.M.darkSteel, 4));
    }
  }
  const dish = part(ctx, new THREE.SphereGeometry(1.0, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), ctx.M.clad, 0, H - 3, 0.7);
  dish.rotation.x = Math.PI * 0.55;
  g.add(dish);
  g.add(part(ctx, new THREE.BoxGeometry(1.2, 0.3, 1.2), ctx.M.concrete, 0, 0.15, 0));
  g.add(part(ctx, new THREE.BoxGeometry(0.8, 1.2, 0.5), ctx.M.steel, 0.9, 0.6, 0));
  lampAt(ctx, g, 0, H + 0.2, 0, { intensity: 3, distance: 10, w: 0.12, h: 0.16 });
  g.userData.colliders = [{ x: 0, z: 0, r: 0.75 }, { x: 0.9, z: 0, r: 0.5 }];
  return g;
}

/* -------------------------------------------------------------------- pad */

/** The pad the Avalon lands on: an octagon of concrete with painted rings, a hand above the crust. */
export function buildLandingPad(ctx, field) {
  const g = new THREE.Group();
  const R = field.PAD_R;
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const x = c.getContext('2d');
  x.fillStyle = '#8e877c';
  x.fillRect(0, 0, 512, 512);
  x.strokeStyle = '#e2d4a8';
  x.lineWidth = 12;
  x.beginPath(); x.arc(256, 256, 205, 0, Math.PI * 2); x.stroke();
  x.lineWidth = 6;
  x.beginPath(); x.arc(256, 256, 150, 0, Math.PI * 2); x.stroke();
  x.fillStyle = '#c9a14a';
  x.beginPath(); x.moveTo(256, 120); x.lineTo(320, 250); x.lineTo(256, 215); x.lineTo(192, 250); x.closePath(); x.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  ctx.own(tex);
  const mat = ctx.own(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0.05 }));
  const geo = ctx.own(new THREE.CylinderGeometry(R, R + 0.4, field.PAD_TOP + 0.1, 8));
  geo.rotateY(Math.PI / 8);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, 0.5 + pos.getX(i) / (R * 2.2), 0.5 + pos.getZ(i) / (R * 2.2));
  const plate = new THREE.Mesh(geo, mat);
  plate.position.y = (field.PAD_TOP + 0.1) / 2 - 0.1;
  plate.receiveShadow = ctx.t4;
  plate.userData.phys = 'ground';
  g.add(plate);
  // Edge lamps at four corners, flush.
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const lamp = part(ctx, new THREE.BoxGeometry(0.24, 0.06, 0.24), ctx.M.lantern, Math.cos(a) * (R - 0.6), field.PAD_TOP + 0.02, Math.sin(a) * (R - 0.6));
    lamp.userData.phys = 'ground';
    g.add(lamp);
    const mark = new THREE.Object3D();
    mark.position.set(Math.cos(a) * (R - 0.6), field.PAD_TOP + 0.4, Math.sin(a) * (R - 0.6));
    mark.userData.lamp = { color: 0xe6a443, intensity: 3, distance: 9, decay: 1.6 };
    g.add(mark);
    ctx.lamps.push(mark);
  }
  g.userData.colliders = [];
  return g;
}

/* ----------------------------------------------------------- crates, drums */

export function buildCrateStack(ctx, lm, seed = 1) {
  const g = new THREE.Group();
  const r = rng(0xc4a7e + seed * 19);
  const pallet = part(ctx, new THREE.BoxGeometry(2.6, 0.14, 2.0), ctx.M.timber, 0, 0.07, 0);
  g.add(pallet);
  const spots = [[-0.62, -0.45], [0.62, -0.45], [-0.62, 0.48], [0.62, 0.48]];
  let y = 0.14;
  spots.forEach(([x, z], i) => {
    const s = 0.92 + r() * 0.18;
    const c = part(ctx, new THREE.BoxGeometry(s * 1.1, s * 0.9, s * 0.85), i % 2 ? ctx.M.crate : ctx.M.crateB, x, y + s * 0.45, z, { cast: true });
    c.rotation.y = (r() - 0.5) * 0.12;
    g.add(c);
  });
  const topS = 0.95;
  g.add(part(ctx, new THREE.BoxGeometry(topS * 1.1, topS * 0.9, topS * 0.85), ctx.M.crateB, -0.3, y + 1.0 + topS * 0.45, 0, { cast: true }));
  g.userData.colliders = [{ x: 0, z: 0, r: 1.55 }];
  return g;
}

export function buildDrumRack(ctx, lm, seed = 1) {
  const g = new THREE.Group();
  const r = rng(0xd7 + seed * 23);
  g.add(part(ctx, new THREE.BoxGeometry(2.0, 0.12, 1.4), ctx.M.timber, 0, 0.06, 0));
  for (const [x, z] of [[-0.62, -0.33], [0, -0.33], [0.62, -0.33], [-0.31, 0.33], [0.31, 0.33]]) {
    if (r() < 0.15) continue;
    g.add(part(ctx, new THREE.CylinderGeometry(0.29, 0.29, 0.88, 18), r() < 0.5 ? ctx.M.drum : ctx.M.drumB, x, 0.12 + 0.44, z, { cast: true }));
  }
  // One on its side beside the pallet.
  put(g, part(ctx, new THREE.CylinderGeometry(0.29, 0.29, 0.88, 18), ctx.M.rusted, 0.4, 0.29, 1.15), 0, 0.4, Math.PI / 2);
  g.userData.colliders = [{ x: 0, z: 0.2, r: 1.25 }];
  return g;
}

/* ----------------------------------------------------------------- habitat */

/**
 * A civilian shelter: a half-sunk dome of insulated panels with a vestibule,
 * two small windows and the heat line that feeds it coming up out of the
 * ground. The windows are dark. Nothing about it is lit: its heat has gone.
 */
export function buildHabitat(ctx) {
  const g = new THREE.Group();
  const R = 4.2;
  const dome = part(ctx, new THREE.SphereGeometry(R, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), ctx.M.habShell, 0, -0.3, 0, { cast: true });
  dome.scale.y = 0.72;
  g.add(dome);
  // Panel seams.
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI;
    const seam = part(ctx, new THREE.TorusGeometry(R + 0.02, 0.035, 4, 36, Math.PI), ctx.M.darkSteel, 0, -0.3, 0);
    seam.rotation.set(0, a, 0);
    seam.scale.set(1, 0.72, 1);
    g.add(seam);
  }
  g.add(part(ctx, new THREE.TorusGeometry(R * 0.98, 0.12, 6, 40).rotateX(Math.PI / 2), ctx.M.concrete, 0, -0.18, 0));
  // The vestibule and its door.
  g.add(part(ctx, new THREE.BoxGeometry(2.0, 2.4, 1.8), ctx.M.habShell, 0, 1.15, R - 0.2, { cast: true }));
  g.add(part(ctx, new THREE.BoxGeometry(2.2, 0.15, 2.0), ctx.M.darkSteel, 0, 2.4, R - 0.2));
  g.add(part(ctx, new THREE.BoxGeometry(0.95, 1.95, 0.06), ctx.M.rusted, 0, 1.0, R + 0.72));
  g.add(part(ctx, new THREE.BoxGeometry(0.1, 0.3, 0.08), ctx.M.darkSteel, 0.35, 1.0, R + 0.77));
  // Two small dark windows.
  for (const a of [-0.9, 0.9]) {
    const wx = Math.sin(a) * R * 0.86, wz = Math.cos(a) * R * 0.86;
    const w = part(ctx, new THREE.BoxGeometry(0.7, 0.45, 0.12), ctx.M.glassDark, wx, 1.6, wz);
    w.rotation.y = a;
    g.add(w);
  }
  // The heat line, lagged, up out of the ground and into the wall.
  g.add(between(ctx, [-R - 0.4, -0.2, -1.0], [-R - 0.4, 1.0, -1.0], 0.2, ctx.M.insul, 12));
  g.add(between(ctx, [-R - 0.4, 1.0, -1.0], [-R + 0.6, 1.0, -1.0], 0.2, ctx.M.insul, 12));
  put(g, part(ctx, new THREE.TorusGeometry(0.2, 0.04, 6, 14), ctx.M.paintRed, -R - 0.4, 0.6, -1.0), Math.PI / 2, 0, 0);
  // A flue and an aerial, both cold.
  g.add(part(ctx, new THREE.CylinderGeometry(0.16, 0.16, 1.6, 10), ctx.M.rusted, 1.3, 3.2, -1.2));
  g.add(between(ctx, [-1.0, 2.6, 0.8], [-1.0, 5.2, 0.8], 0.025, ctx.M.darkSteel, 5));
  const tag = sign(ctx, 'SHELTER', 0.8, 0.22);
  tag.position.set(0, 2.1, R + 0.71);
  g.add(tag);
  g.userData.colliders = [{ x: 0, z: 0, r: R - 0.1 }, { x: 0, z: R, r: 1.25 }, { x: -R - 0.4, z: -1.0, r: 0.4 }];
  return g;
}

/* ---------------------------------------------------- the Fifth's siphon */

/**
 * The siphon manifold: a shell-and-tube heat exchanger in the Fifth Guild's
 * dark livery, clamped onto the main by two taps from above and drawing its
 * heat away into a bundle of lines that go straight down into the ground. It
 * vents no steam. It is furred with frost: whatever it feeds below the crust
 * is taking heat, not giving it. Long axis along local x.
 */
export function buildSiphonManifold(ctx) {
  const g = new THREE.Group();
  const L = 7.0, R = 1.0, Y = 1.0;
  put(g, part(ctx, new THREE.CylinderGeometry(R, R, L, 28), ctx.M.livery, 0, Y, 0, { cast: true }), 0, 0, Math.PI / 2);
  for (const sx of [-1, 1]) {
    put(g, part(ctx, new THREE.CylinderGeometry(R + 0.14, R + 0.14, 0.22, 28), ctx.M.darkSteel, sx * (L / 2 - 0.05), Y, 0), 0, 0, Math.PI / 2);
    const head = part(ctx, new THREE.SphereGeometry(R, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), ctx.M.livery, sx * (L / 2 + 0.06), Y, 0);
    head.rotation.z = -sx * Math.PI / 2;
    head.scale.y = 0.5;
    g.add(head);
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      g.add(part(ctx, new THREE.SphereGeometry(0.045, 6, 4), ctx.M.brass, sx * (L / 2 + 0.07), Y + Math.cos(a) * (R + 0.08), Math.sin(a) * (R + 0.08)));
    }
    // The saddles it sits in.
    g.add(part(ctx, new THREE.BoxGeometry(0.6, Y - 0.25, 1.9), ctx.M.concrete, sx * 2.3, (Y - 0.25) / 2, 0));
    g.add(part(ctx, new THREE.BoxGeometry(0.7, 0.18, 2.1), ctx.M.darkSteel, sx * 2.3, Y - 0.2, 0));
  }
  // Frost: collars of rime round the shell, thickest at the cold end.
  for (let k = 0; k < 6; k++) {
    const x = -L / 2 + 0.7 + k * 1.1;
    const th = 0.03 + (k / 5) * 0.06;
    put(g, part(ctx, new THREE.CylinderGeometry(R + th, R + th, 0.55 + (k % 2) * 0.3, 28), ctx.M.rime, x, Y, 0), 0, 0, Math.PI / 2);
  }
  // Nozzles on top, where the taps come down onto it.
  for (const x of [-2.2, 2.2]) {
    g.add(part(ctx, new THREE.CylinderGeometry(0.3, 0.3, 0.3, 16), ctx.M.livery, x, Y + R + 0.03, 0));
    g.add(part(ctx, new THREE.CylinderGeometry(0.4, 0.4, 0.08, 16), ctx.M.darkSteel, x, Y + R + 0.14, 0));
  }
  // The bundle of lines going down into the crust, and the pump that drives them.
  g.add(part(ctx, new THREE.BoxGeometry(1.4, 1.2, 1.1), ctx.M.livery, 0, 0.6, -2.0, { cast: true }));
  put(g, part(ctx, new THREE.CylinderGeometry(0.34, 0.34, 1.0, 16), ctx.M.darkSteel, 0.95, 0.6, -2.0), 0, 0, Math.PI / 2);
  for (const [x, z] of [[-0.5, -1.2], [0, -1.15], [0.5, -1.2]]) {
    g.add(between(ctx, [x, Y - 0.4, -0.6], [x, Y - 0.4, z - 0.1], 0.11, ctx.M.rime, 10));
  }
  for (const x of [-0.45, 0, 0.45]) {
    g.add(between(ctx, [x, 0.6, -2.6], [x * 1.4, -0.2, -3.6], 0.12, ctx.M.rime, 10));
  }
  const hz = placard('V-5', { w: 0.5, h: 0.2, fg: '#1a1714', bg: '#c9a14a' });
  ctx.own(hz.geometry, hz.material, hz.material.map);
  hz.position.set(0, 0.85, -2.56);
  hz.rotation.y = Math.PI;
  g.add(hz);
  g.userData.colliders = [
    { x: -2.6, z: 0, r: 1.15 }, { x: 0, z: 0, r: 1.15 }, { x: 2.6, z: 0, r: 1.15 },
    { x: -3.7, z: 0, r: 0.8 }, { x: 3.7, z: 0, r: 0.8 }, { x: 0, z: -2.1, r: 0.95 }, { x: 0, z: -3.3, r: 0.6 }
  ];
  return g;
}

/* -------------------------------------------------------------- lamp post */

export function buildLampPost(ctx, index = 0) {
  const g = new THREE.Group();
  const H = 3.5;
  g.add(part(ctx, new THREE.CylinderGeometry(0.055, 0.08, H, 6), ctx.M.darkSteel, 0, H / 2, 0, { cast: true }));
  g.add(part(ctx, new THREE.BoxGeometry(0.36, 0.14, 0.36), ctx.M.concrete, 0, 0.07, 0));
  g.add(part(ctx, new THREE.BoxGeometry(0.6, 0.045, 0.045), ctx.M.darkSteel, 0.29, H - 0.12, 0));
  g.add(between(ctx, [0.05, H - 0.6, 0], [0.42, H - 0.14, 0], 0.02, ctx.M.darkSteel, 5));
  // A heat-shield hood, then the caged lantern hanging from it.
  g.add(part(ctx, new THREE.ConeGeometry(0.2, 0.14, 8), ctx.M.rusted, 0.55, H - 0.2, 0));
  lampAt(ctx, g, 0.55, H - 0.42, 0, { intensity: 5, distance: 13, w: 0.15, h: 0.26 });
  for (const a of [0, Math.PI / 2]) {
    const cage = part(ctx, new THREE.BoxGeometry(0.21, 0.3, 0.012), ctx.M.darkSteel, 0.55, H - 0.42, 0);
    cage.rotation.y = a;
    g.add(cage);
  }
  g.rotation.y = (index * 2.399) % (Math.PI * 2);
  g.userData.colliders = [{ x: 0, z: 0, r: 0.3 }];
  return g;
}

/* ===================================================== laid by the world */

/**
 * The pipe network: the caldera main and every spur and tap, as ONE object.
 * Each straight leg is cut into pieces no longer than 3 m, so the overlap check
 * measures a pipe as the pipe it is rather than as the box round a curve; the
 * cladding is banded; a support stands under the main every few metres, a
 * concrete block under each riser of the expansion loop. Heights in the run are
 * above the ground at each point.
 *
 * @returns {{ group: THREE.Group, colliders: Array<{x:number,z:number,radius:number}> }}
 */
export function buildPipes(ctx, runs, field) {
  const g = new THREE.Group();
  g.name = 'ember-pipes';
  const colliders = [];
  const MAX = 3.0;
  for (const run of runs) {
    const rr = run.radius;
    const P = run.points.map(([x, h, z]) => [x, field.height(x, z) + h, z]);
    let sinceSupport = 2;
    for (let i = 0; i < P.length - 1; i++) {
      const a = P[i], b = P[i + 1];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      const n = Math.max(1, Math.ceil(L / MAX));
      const vertical = Math.hypot(b[0] - a[0], b[2] - a[2]) < 0.05;
      for (let k = 0; k < n; k++) {
        const t0 = k / n, t1 = (k + 1) / n;
        const p0 = [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0, a[2] + (b[2] - a[2]) * t0];
        const p1 = [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1, a[2] + (b[2] - a[2]) * t1];
        g.add(between(ctx, p0, p1, rr, ctx.M.clad, 14));
        // A band where each sheet of cladding laps the next.
        const band = between(ctx, p0, p0.map((v, j) => v + (p1[j] - p0[j]) * (0.06 / (L / n))), rr + 0.025, ctx.M.darkSteel, 14);
        g.add(band);
        if (vertical) continue;
        sinceSupport += L / n;
        // A support under the main and the spurs: a post, a crosshead and a saddle.
        const lastPiece = i === P.length - 2 && k === n - 1;
        if (!run.id.startsWith('tap') && !lastPiece && run.points[i][1] >= 2.9 && run.points[i + 1][1] >= 2.9 && sinceSupport >= 6) {
          const mx = p1[0], mz = p1[2];
          const gy = field.height(mx, mz);
          const top = p1[1] - rr - 0.04;
          if (top - gy > 1.2) {
            g.add(part(ctx, new THREE.BoxGeometry(0.22, top - gy - 0.12, 0.22), ctx.M.steel, mx, gy + (top - gy - 0.12) / 2, mz, { cast: true }));
            const head = part(ctx, new THREE.BoxGeometry(rr * 2 + 0.4, 0.12, 0.3), ctx.M.darkSteel, mx, top - 0.06, mz);
            head.rotation.y = Math.atan2(-(b[2] - a[2]), b[0] - a[0]) + Math.PI / 2;
            g.add(head);
            g.add(part(ctx, new THREE.BoxGeometry(0.5, 0.12, 0.5), ctx.M.concrete, mx, gy + 0.04, mz));
            colliders.push({ x: mx, z: mz, radius: 0.32 });
            sinceSupport = 0;
          }
        }
      }
      // A joint at every turn: a collar the pipe's own size.
      if (i > 0) g.add(part(ctx, new THREE.SphereGeometry(rr * 1.02, 14, 10), ctx.M.clad, a[0], a[1], a[2]));
      // A riser that comes down to the ground stands on a block and is a body to walk into.
      if (vertical && Math.min(a[1], b[1]) - field.height(a[0], a[2]) < 3.2 && run.id === 'caldera-main') {
        const gy = field.height(a[0], a[2]);
        g.add(part(ctx, new THREE.BoxGeometry(rr * 2 + 0.5, gy + 3.0 - rr - 0.05 - gy, rr * 2 + 0.5), ctx.M.concrete, a[0], gy + (3.0 - rr - 0.05) / 2, a[2]));
        colliders.push({ x: a[0], z: a[2], radius: rr + 0.45 });
      }
    }
  }
  // The expansion loop's placard, hung from its top run where the lane passes under.
  const main = runs.find(r => r.id === 'caldera-main');
  const top = main?.points.filter(p => p[1] > 6);
  if (top && top.length >= 2) {
    const [ax, , az] = top[0], [bx, , bz] = top[top.length - 1];
    const mx = (ax + bx) / 2, mz = (az + bz) / 2;
    const y = field.height(mx, mz) + top[0][1] - main.radius - 0.42;
    const tag = sign(ctx, 'CALDERA MAIN', 1.8, 0.36);
    tag.position.set(mx, y, mz + main.radius + 0.06);
    g.add(tag);
    const back = sign(ctx, 'CALDERA MAIN', 1.8, 0.36);
    back.position.set(mx, y, mz - main.radius - 0.06);
    back.rotation.y = Math.PI;
    g.add(back);
    for (const dx of [-0.8, 0.8]) g.add(between(ctx, [mx + dx, y + 0.18, mz], [mx + dx, y + 0.42, mz], 0.015, ctx.M.darkSteel, 4));
    g.add(part(ctx, new THREE.BoxGeometry(1.9, 0.4, 0.04), ctx.M.darkSteel, mx, y, mz));
  }
  return { group: g, colliders };
}

/**
 * The rail along the rim: posts on the arc of the edge, two rails and a toe
 * board between each pair, the top rail painted. Built in short pieces so the
 * overlap check measures each one, and with colliders as a closed chain of
 * circles, so there is no gap a player could step through.
 */
export function buildRimRail(ctx, rim, field) {
  const g = new THREE.Group();
  g.name = 'ember-rim-rail';
  const R = rim.rail;
  const span = rim.span;
  const at = x => [x, rim.cz + Math.sqrt(R * R - x * x)];
  const posts = [];
  for (let x = -span; x <= span + 1e-6; x += 1.9) posts.push(at(x));
  for (let i = 0; i < posts.length; i++) {
    const [x, z] = posts[i];
    const y = field.height(x, z);
    g.add(part(ctx, new THREE.BoxGeometry(0.08, 1.15, 0.08), ctx.M.darkSteel, x, y + 0.56, z));
    if (i === posts.length - 1) continue;
    const [bx, bz] = posts[i + 1];
    const by = field.height(bx, bz);
    for (const [h, mat, r] of [[1.1, ctx.M.paintYellow, 0.03], [0.58, ctx.M.steel, 0.025]]) {
      g.add(between(ctx, [x, y + h, z], [bx, by + h, bz], r, mat, 6));
    }
    g.add(strut(ctx, [x, y + 0.09, z], [bx, by + 0.09, bz], 0.16, 0.025, ctx.M.darkSteel));
  }
  const colliders = [];
  const Rc = R + 0.3;
  const half = Math.asin(Math.min(1, (span + 1) / Rc));
  const N = Math.ceil((2 * half * Rc) / 1.2);
  for (let i = 0; i <= N; i++) {
    const phi = -half + (2 * half) * (i / N);
    colliders.push({ x: Math.sin(phi) * Rc, z: rim.cz + Math.cos(phi) * Rc, radius: 0.9 });
  }
  return { group: g, colliders };
}

/**
 * Power lines from the transformer down the line of pylons: three conductors a
 * span, sagging, in pieces no longer than two metres.
 */
export function buildPowerLines(ctx, chain) {
  const g = new THREE.Group();
  g.name = 'ember-power-lines';
  for (let s = 0; s < chain.length - 1; s++) {
    const A = chain[s], B = chain[s + 1];
    for (let c = 0; c < 3; c++) {
      const a = A[Math.min(c, A.length - 1)], b = B[Math.min(c, B.length - 1)];
      const L = Math.hypot(b.x - a.x, b.z - a.z);
      const sag = Math.min(3.2, L * 0.045);
      const n = Math.max(4, Math.ceil(L / 2));
      let prev = null;
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        // Stop a finger short of each insulator, so the wire meets it and does not run into it.
        const tt = 0.004 + t * 0.992;
        const p = [a.x + (b.x - a.x) * tt, a.y + (b.y - a.y) * tt - Math.sin(tt * Math.PI) * sag, a.z + (b.z - a.z) * tt];
        if (prev) g.add(between(ctx, prev, p, 0.018, ctx.M.darkSteel, 4));
        prev = p;
      }
    }
  }
  return g;
}

export { rockGeometry };
